export interface AsciiSettings {
    scale: number;
    spacing: number;
    charSet: string;
    customChar: string;
}

export interface Adjustments {
    brightness: number;
    contrast: number;
    saturation?: number;
    hueRotation?: number;
    sharpness?: number;
    gamma: number;
}

export interface PostProcessSettings {
    bloom: boolean;
    grain: boolean;
    chromatic: boolean;
    vignette: boolean;
    crt: boolean;
}

export interface GridCache {
    imgData: Uint8ClampedArray;
    cols: number;
    rows: number;
    cellSize: number;
}