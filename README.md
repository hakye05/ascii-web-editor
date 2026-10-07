# ASCII Web Editor

A real-time image-to-ASCII converter and image editor built with React + TypeScript + Vite with integration of WebGPU.

By leveraging WebGPU compute and render shaders, this application processes ASCII editing and conversion at 60 FPS.

## Features

* **Real-time WebGPU Pipeline:** Offloads image adjustments, character calculations, and grid rendering to the GPU via custom WGSL shaders.
* **Live Image Editing:** Interactive control over custom character sets, brightness, contrast, saturation, hue rotation, gamma, scale, and background color.
* **Multi-Format Export:**
  * **PNG / JPG:** Direct high-resolution canvas bitmap capture.
  * **TXT:** Non-colored raw ASCII representation of canvas.
* **Font Atlas Generation:** Automatically rasterizes custom and pre-defined character sets into a GPU texture atlas.

## Rendering Pipeline

The core rendering engine is managed by `AsciiPipelineManager`, utilizing two WGSL shader for computing and rendering.

### 1. **Compute Shader (`asciiShaderWGSL`):**
* Takes the uploaded image source texture and divides the screen into a grid of cells.
* Performs 4x4 sub-pixel grid sampling for color averaging.
* Applies color adjustments (`brightness`, `contrast`, `hue/saturation`, `gamma`) on individual grid cells.
* Matches cell luminance ($0.2126R + 0.7152G + 0.0722B$) against the Font Atlas density values and outputs the result into a shared GPU storage buffer (`CellOutput`).

### 2. **Render Shader (`asciiRenderWGSL`):**
* Uses instanced quad rendering where each instance corresponds to an ASCII grid cell.
* Samples character glyph masks from the cached Font Atlas texture.
* Blends source colors, background color, and alpha masks directly onto canvas context.

## Usage

1. **Upload an Image:** Drag & drop or select an image to upload it directly to GPU VRAM.
2. **Adjust Settings:** Tweak scale, contrast, brightness, gamma, or pick predefined character sets in the sidebar editor.
3. **Export:** Choose your desired output format (`.png`, `.jpg`, or `.txt`) and click export.

## Post-Processing Effects (Roadmap)

The state architecture (`useEditorState`) is equipped to support secondary WebGPU post-processing passes:

- [ ] **Bloom Pass:** Threshold-based luminance glow around light characters.
- [ ] **Film Grain & Vignette:** Procedural noise and edge darkening shaders.
- [ ] **CRT / Scanline Effect:** Retro CRT monitor distortion pass.
- [ ] **Chromatic Aberration:** RGB color channel offset.