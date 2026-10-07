import { createFontAtlas, type FontAtlasData } from "./fontAtlas";
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

    // --- Reusable GPU Sampler ---
    private sampler: GPUSampler | null = null;

    // --- Texture Cache ---
    private sourceTexture: GPUTexture | null = null;
    private sourceWidth = 0;
    private sourceHeight = 0;

    /// --- Font Atlas Cache ---
    private cachedFontAtlas: FontAtlasData | null = null;
    private cachedAtlasTexture: GPUTexture | null = null;
    private cachedFontKey = ""; // Combined key: `${fontFamily}::${fontSize}::${charSetString}`

    // --- Export State Cache ---
    private lastCellBuffer: GPUBuffer | null = null;
    private lastCols = 0;
    private lastRows = 0;
    private lastCharSetString = "";

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

        // Initialize sampler once
        this.sampler = this.device.createSampler({
            magFilter: "nearest",
            minFilter: "nearest",
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
     * Helper to retrieve or regenerate the font atlas and GPU texture.
     * Recreates the atlas only when the character set string, font family, or font size changes.
     */
    private updateFontAtlas(
        charSetString: string,
        fontFamily: string = "monospace",
        fontSize: number = 32
    ): FontAtlasData {
        if (!this.device) throw new Error("Device not initialized.");

        const cacheKey = `${fontFamily}::${fontSize}::${charSetString}`;

        if (this.cachedFontAtlas && this.cachedAtlasTexture && this.cachedFontKey === cacheKey) {
            return this.cachedFontAtlas;
        }

        if (this.cachedAtlasTexture) {
            this.cachedAtlasTexture.destroy();
            this.cachedAtlasTexture = null;
        }

        const fontAtlas = createFontAtlas(charSetString, fontFamily, fontSize);

        const atlasTexture = this.device.createTexture({
            size: [fontAtlas.textureWidth, fontAtlas.textureHeight, 1],
            format: "rgba8unorm",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        });

        this.device.queue.copyExternalImageToTexture(
            { source: fontAtlas.canvas },
            { texture: atlasTexture },
            [fontAtlas.textureWidth, fontAtlas.textureHeight]
        );

        this.cachedFontAtlas = fontAtlas;
        this.cachedAtlasTexture = atlasTexture;
        this.cachedFontKey = cacheKey;

        return fontAtlas;
    }

    /**
     * Executes compute and render passes to draw the final ASCII grid frame.
     * 
     * @param charSetString Characters to build the font atlas from
     * @param scale Resolution scaling multiplier
     * @param bgColor Background color hex string (e.g. "#000000")
     * @param adjustments Color manipulation parameters
     * @param fontFamily Target CSS font family (default: "monospace")
     */
    renderFrame(
        charSetString: string,
        scale: number,
        bgColor: string,
        adjustments: Adjustments,
        fontFamily: string = "monospace",
        fontSize: number = 32,
    ): void {
        if (!this.device || !this.context || !this.computePipeline || !this.renderPipeline || !this.sourceTexture || !this.sampler) {
            return;
        }

        const device = this.device;

        // Font atlas generation for character subset
        const fontAtlas = this.updateFontAtlas(charSetString, fontFamily, fontSize);
        const atlasTexture = this.cachedAtlasTexture!;

        // Aspect ratio calculations
        const fontAspectRatio = fontAtlas.cellHeight / fontAtlas.cellWidth;
        const baseCols = Math.round(60 * scale);
        const targetCols = Math.round(baseCols * fontAspectRatio);
        const cols = Math.min(targetCols, this.sourceWidth);

        const imageAspectRatio = this.sourceHeight / this.sourceWidth;
        const rows = Math.max(1, Math.round((cols * imageAspectRatio) / fontAspectRatio));

        const totalCells = cols * rows;
        if (totalCells <= 0) return;

        // Cache grid dimensions and characters for TXT export
        this.lastCols = cols;
        this.lastRows = rows;
        this.lastCharSetString = charSetString;

        const asciiPixelWidth = cols * fontAtlas.cellWidth;
        const asciiPixelHeight = rows * fontAtlas.cellHeight;

        const canvas = this.context.canvas as HTMLCanvasElement;

        // Resize target canvas when resolution changes
        if (canvas.width !== asciiPixelWidth || canvas.height !== asciiPixelHeight) {
            canvas.width = asciiPixelWidth;
            canvas.height = asciiPixelHeight;
        }

        // Clean up last cell buffer
        if (this.lastCellBuffer) {
            this.lastCellBuffer.destroy();
            this.lastCellBuffer = null;
        }

        // Storage buffer shared between Compute and Render passes
        const cellStorageBuffer = device.createBuffer({
            size: totalCells * 16,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
        });
        this.lastCellBuffer = cellStorageBuffer;

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
                { binding: 1, resource: this.sampler },
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
                { binding: 1, resource: this.sampler },
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

        // Clean up frame allocations to prevent VRAM memory leaks
        computeBuffer.destroy();
        lumBuffer.destroy();
        adjBuffer.destroy();
        renderBuffer.destroy();
    }

    /**
     * Reads back grid cell data from the last rendered frame to construct a plain text string.
     */
    async exportAsText(overrideCharSet?: string): Promise<string | null> {
        if (!this.device || !this.lastCellBuffer || this.lastCols === 0 || this.lastRows === 0) {
            return null;
        }

        const charSetString = overrideCharSet || this.lastCharSetString;
        const totalCells = this.lastCols * this.lastRows;
        const bufferSize = totalCells * 16;

        const stagingBuffer = this.device.createBuffer({
            size: bufferSize,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        });

        const commandEncoder = this.device.createCommandEncoder();
        commandEncoder.copyBufferToBuffer(this.lastCellBuffer, 0, stagingBuffer, 0, bufferSize);
        this.device.queue.submit([commandEncoder.finish()]);

        await stagingBuffer.mapAsync(GPUMapMode.READ);
        const arrayBuffer = stagingBuffer.getMappedRange();
        const uint32Array = new Uint32Array(arrayBuffer);

        const uniqueChars = Array.from(new Set(charSetString.split("")));
        let asciiStr = "";

        for (let r = 0; r < this.lastRows; r++) {
            for (let c = 0; c < this.lastCols; c++) {
                const idx = r * this.lastCols + c;
                const charIndex = uint32Array[idx * 4];
                const char = uniqueChars[charIndex] || " ";
                asciiStr += char;
            }
            asciiStr += "\n";
        }

        stagingBuffer.unmap();
        stagingBuffer.destroy();

        return asciiStr;
    }
}

/**
 * Downloads the current WebGPU canvas state as an image file (PNG / JPG)
 */
export async function exportImage(
    canvas: HTMLCanvasElement,
    format: "png" | "jpg"
): Promise<void> {
    const mimeType = format === "jpg" ? "image/jpeg" : "image/png";

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.download = `ascii-art.${format}`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
            resolve();
        }, mimeType, 0.95);
    });
}