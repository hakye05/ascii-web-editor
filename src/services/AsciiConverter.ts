import type { AsciiSettings, Adjustments, GridCache } from "../types/ascii";

/**
 * Samples the image pixels down into a proportion-based grid.
 * Automatically preserves aspect ratio and caps resolution for high-performance rendering.
 */
export const sampleImageGrid = (
    img: HTMLImageElement,
    asciiSettings: AsciiSettings,
    adjustments: Adjustments
): GridCache | null => {
    // 1. Determine target columns proportionally based on scale
    const targetCols = Math.round(60 * asciiSettings.scale);
    const cols = Math.min(targetCols, img.width);

    // 2. Calculate rows using the image's aspect ratio to prevent stretching
    const aspectRatio = img.height / img.width;
    const rows = Math.max(1, Math.round(cols * aspectRatio));

    if (cols <= 0 || rows <= 0) return null;

    // 3. Calculate cell size for the renderer based on the scaled grid dimensions
    const cellSize = Math.max(4, Math.round(img.width / cols));

    const offScreen = document.createElement('canvas');
    offScreen.width = cols;
    offScreen.height = rows;
    const offCtx = offScreen.getContext('2d', { willReadFrequently: true });
    if (!offCtx) return null;

    const saturation = adjustments.saturation ?? 0;
    const hueRotation = adjustments.hueRotation ?? 0;

    offCtx.filter = `
        brightness(${100 + adjustments.brightness}%) 
        contrast(${100 + adjustments.contrast}%)
        saturate(${100 + saturation}%)
        hue-rotate(${hueRotation}deg)
    `;
    offCtx.drawImage(img, 0, 0, cols, rows);
    const imgData = offCtx.getImageData(0, 0, cols, rows).data;

    return { imgData, cols, rows, cellSize };
};