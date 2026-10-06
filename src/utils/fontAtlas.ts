/**
 * Data output structure for font atlas.
 */
export interface FontAtlasData {
  canvas: HTMLCanvasElement;
  textureWidth: number;
  textureHeight: number;
  cellWidth: number;
  cellHeight: number;
  charMap: Map<string, number>;
  charLuminances: number[];
}

/**
 * Creates a 2D canvas font atlas and calculates character luminance values 
 * 
 * @param charSetString String containing all characters to include in the atlas
 * @param fontFamily CSS font family (default: "Consolas, monospace")
 * @param fontSize Font size in pixels (default: 32)
 * @returns {@link FontAtlasData} containing the generated texture canvas and metadata
 */
export function createFontAtlas(
  charSetString: string,
  fontFamily: string = "Consolas, monospace",
  fontSize: number = 32
): FontAtlasData {
  const uniqueChars = Array.from(new Set(charSetString.split("")));
  const totalChars = uniqueChars.length;

  const cellWidth = Math.ceil(fontSize * 0.6);
  const cellHeight = fontSize;

  const cols = Math.ceil(Math.sqrt(totalChars));
  const rows = Math.ceil(totalChars / cols);

  const textureWidth = cols * cellWidth;
  const textureHeight = rows * cellHeight;

  // Initialize canvas
  const canvas = document.createElement("canvas");
  canvas.width = textureWidth;
  canvas.height = textureHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  if (!ctx) {
    throw new Error("Failed to create 2D context for Font Atlas");
  }

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, textureWidth, textureHeight);

  // Configure text
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.textBaseline = "top";

  const charMap = new Map<string, number>();
  const charLuminances: number[] = [];

  // Render each character into its grid cell and compute its luminance value
  uniqueChars.forEach((char, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = col * cellWidth;
    const y = row * cellHeight;

    ctx.fillText(char, x, y);
    charMap.set(char, index);

    const imgData = ctx.getImageData(x, y, cellWidth, cellHeight).data;
    let totalWhitePixels = 0;
    for (let i = 0; i < imgData.length; i += 4) {
      totalWhitePixels += imgData[i] / 255;
    }
    const avgLuminance = totalWhitePixels / (cellWidth * cellHeight);
    charLuminances.push(avgLuminance);
  });

  return {
    canvas,
    textureWidth,
    textureHeight,
    cellWidth,
    cellHeight,
    charMap,
    charLuminances,
  };
}