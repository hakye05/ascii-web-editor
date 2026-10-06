import { createFontAtlas } from "./fontAtlas";
import { asciiShaderWGSL } from "../shaders/asciiWGSL";
import { asciiRenderWGSL } from "../shaders/asciiRenderWGSL";

/**
 * Image adjustment parameters for pre-processing color dynamics.
 */
interface Adjustments {
    brightness: number;
    contrast: number;
    saturation: number;
    hueRotation: number;
    gamma: number;
}

/**
 * WebGPU for realtime image-to-ASCII rendering. Manages luminance sampling and rendering for atlas textures.
 */
export class AsciiPipelineManager {
    private device: GPUDevice | null = null;
    private context: GPUCanvasContext | null = null;
    private computePipeline: GPUComputePipeline | null = null;
    private renderPipeline: GPURenderPipeline | null = null;
    private canvasFormat: GPUTextureFormat = "bgra8unorm";

    // --- Texture Cache ---
    private sourceTexture: GPUTexture | null = null;
    private sourceWidth = 0;
    private sourceHeight = 0;

    /**
     * Initializes the WebGPU device context, configures target canvas format,
     * and compiles both compute and render pipelines.
     * 
     * @param canvas HTML canvas target for rendering output
     */
    async init(canvas: HTMLCanvasElement): Promise<void> {
        if (!navigator.gpu) throw new Error("WebGPU is not supported.");
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) throw new Error("No WebGPU adapter found.");

        this.device = await adapter.requestDevice();
        this.context = canvas.getContext("webgpu") as GPUCanvasContext;
        this.canvasFormat = navigator.gpu.getPreferredCanvasFormat();

        this.context.configure({
            device: this.device,
            format: this.canvasFormat,
            alphaMode: "premultiplied",
        });

        const computeModule = this.device.createShaderModule({ code: asciiShaderWGSL });
        this.computePipeline = this.device.createComputePipeline({
            layout: "auto",
            compute: { module: computeModule, entryPoint: "main" },
        });

        const renderModule = this.device.createShaderModule({ code: asciiRenderWGSL });
        this.renderPipeline = this.device.createRenderPipeline({
            layout: "auto",
            vertex: { module: renderModule, entryPoint: "vs_main" },
            fragment: {
                module: renderModule,
                entryPoint: "fs_main",
                targets: [
                    {
                        format: this.canvasFormat,
                        blend: {
                            color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add" },
                            alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
                        },
                    },
                ],
            },
            primitive: { topology: "triangle-list" },
        });
    }

    /**
     * Uploads the image to GPU VRAM. Call this only when the input file changes.
     */
    setSourceImage(image: HTMLImageElement): void {
        if (!this.device) return;

        // Clean up previous texture if present
        if (this.sourceTexture) {
            this.sourceTexture.destroy();
            this.sourceTexture = null;
        }

        this.sourceWidth = image.width;
        this.sourceHeight = image.height;

        this.sourceTexture = this.device.createTexture({
            size: [image.width, image.height, 1],
            format: "rgba8unorm",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        });

        this.device.queue.copyExternalImageToTexture(
            { source: image },
            { texture: this.sourceTexture },
            [image.width, image.height]
        );
    }

    /**
     * Executes compute and render passes to draw the final ASCII grid frame.
     * 
     * @param charSetString Characters to build the font atlas from
     * @param scale Resolution scaling multiplier
     * @param bgColor Background color hex string (e.g. "#000000")
     * @param adjustments Color manipulation parameters
     */
    renderFrame(
        charSetString: string,
        scale: number,
        bgColor: string,
        adjustments: Adjustments
    ): void {
        if (!this.device || !this.context || !this.computePipeline || !this.renderPipeline || !this.sourceTexture) {
            return;
        }

        const device = this.device;

        // Font atlas generation for character subset
        const fontAtlas = createFontAtlas(charSetString, "monospace", 32);

        // Aspect ratio calculations
        const fontAspectRatio = fontAtlas.cellHeight / fontAtlas.cellWidth;
        const baseCols = Math.round(60 * scale);
        const targetCols = Math.round(baseCols * fontAspectRatio);
        const cols = Math.min(targetCols, this.sourceWidth);

        const imageAspectRatio = this.sourceHeight / this.sourceWidth;
        const rows = Math.max(1, Math.round((cols * imageAspectRatio) / fontAspectRatio));

        const totalCells = cols * rows;
        if (totalCells <= 0) return;

        const asciiPixelWidth = cols * fontAtlas.cellWidth;
        const asciiPixelHeight = rows * fontAtlas.cellHeight;

        const canvas = this.context.canvas as HTMLCanvasElement;

        // Resize target canvas when resolution changes
        if (canvas.width !== asciiPixelWidth || canvas.height !== asciiPixelHeight) {
            canvas.width = asciiPixelWidth;
            canvas.height = asciiPixelHeight;
        }

        // Upload font atlas texture
        const atlasTexture = device.createTexture({
            size: [fontAtlas.textureWidth, fontAtlas.textureHeight, 1],
            format: "rgba8unorm",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        });
        device.queue.copyExternalImageToTexture(
            { source: fontAtlas.canvas },
            { texture: atlasTexture },
            [fontAtlas.textureWidth, fontAtlas.textureHeight]
        );

        const sampler = device.createSampler({ magFilter: "nearest", minFilter: "nearest" });

        // Storage buffer shared between Compute and Render passes
        const cellStorageBuffer = device.createBuffer({
            size: totalCells * 16,
            usage: GPUBufferUsage.STORAGE,
        });

        // Grid Dimensions & Atlas Metadata
        const computeParams = new Uint32Array([cols, rows, fontAtlas.charLuminances.length, 0]);
        const computeBuffer = device.createBuffer({ size: computeParams.byteLength, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
        device.queue.writeBuffer(computeBuffer, 0, computeParams);

        // Storage buffer for character luminance values
        const lumArray = new Float32Array(fontAtlas.charLuminances);
        const lumBuffer = device.createBuffer({ size: lumArray.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
        device.queue.writeBuffer(lumBuffer, 0, lumArray);

        // Adjustments Uniform Buffer
        const adjValues = new Float32Array([
            adjustments.brightness / 100,
            adjustments.contrast / 100,
            adjustments.saturation / 100,
            (adjustments.hueRotation * Math.PI) / 180,
            adjustments.gamma,
        ]);
        const adjBuffer = device.createBuffer({
            size: adjValues.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(adjBuffer, 0, adjValues);

        // Bind Group for Compute Shader execution
        const computeBindGroup = device.createBindGroup({
            layout: this.computePipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: this.sourceTexture.createView() },
                { binding: 1, resource: sampler },
                { binding: 2, resource: { buffer: computeBuffer } },
                { binding: 3, resource: { buffer: lumBuffer } },
                { binding: 4, resource: { buffer: cellStorageBuffer } },
                { binding: 5, resource: { buffer: adjBuffer } },
            ],
        });

        // Render Uniforms
        const atlasCols = Math.ceil(Math.sqrt(fontAtlas.charMap.size));
        const atlasRows = Math.ceil(fontAtlas.charMap.size / atlasCols);

        const renderParamsBuffer = new ArrayBuffer(32);
        const uint32View = new Uint32Array(renderParamsBuffer);
        const float32View = new Float32Array(renderParamsBuffer);

        uint32View[0] = cols;
        uint32View[1] = rows;
        uint32View[2] = atlasCols;
        uint32View[3] = atlasRows;

        float32View[4] = asciiPixelWidth;
        float32View[5] = asciiPixelHeight;
        float32View[6] = fontAtlas.cellWidth;
        float32View[7] = fontAtlas.cellHeight;

        const renderBuffer = device.createBuffer({ size: renderParamsBuffer.byteLength, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
        device.queue.writeBuffer(renderBuffer, 0, renderParamsBuffer);

        // Bind Group for Render Shader execution
        const renderBindGroup = device.createBindGroup({
            layout: this.renderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: atlasTexture.createView() },
                { binding: 1, resource: sampler },
                { binding: 2, resource: { buffer: renderBuffer } },
                { binding: 3, resource: { buffer: cellStorageBuffer } },
            ],
        });

        const commandEncoder = device.createCommandEncoder();

        const computePass = commandEncoder.beginComputePass();
        computePass.setPipeline(this.computePipeline);
        computePass.setBindGroup(0, computeBindGroup);
        computePass.dispatchWorkgroups(Math.ceil(cols / 16), Math.ceil(rows / 16));
        computePass.end();

        const hex = bgColor.replace("#", "");
        const bgR = (parseInt(hex.substring(0, 2), 16) || 0) / 255;
        const bgG = (parseInt(hex.substring(2, 4), 16) || 0) / 255;
        const bgB = (parseInt(hex.substring(4, 6), 16) || 0) / 255;

        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: this.context.getCurrentTexture().createView(),
                    clearValue: { r: bgR, g: bgG, b: bgB, a: 1.0 },
                    loadOp: "clear",
                    storeOp: "store",
                },
            ],
        });

        renderPass.setPipeline(this.renderPipeline);
        renderPass.setBindGroup(0, renderBindGroup);
        renderPass.draw(6, totalCells, 0, 0);
        renderPass.end();

        device.queue.submit([commandEncoder.finish()]);
    }
}