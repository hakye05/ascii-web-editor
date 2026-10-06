export const asciiRenderWGSL = /* wgsl */ `
struct GridParams {
  gridWidth: u32,
  gridHeight: u32,
  atlasCols: u32,
  atlasRows: u32,
  viewportWidth: f32,
  viewportHeight: f32,
  cellPixelWidth: f32,
  cellPixelHeight: f32,
};

struct CellInput {
  charIndex: u32,
  r: f32,
  g: f32,
  b: f32,
};

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
  @location(1) color: vec3<f32>,
};

@group(0) @binding(0) var atlasTexture: texture_2d<f32>;
@group(0) @binding(1) var atlasSampler: sampler;
@group(0) @binding(2) var<uniform> gridParams: GridParams;
@group(0) @binding(3) var<storage, read> cells: array<CellInput>;

var<private> pos: array<vec2<f32>, 6> = array<vec2<f32>, 6>(
  vec2<f32>(0.0, 0.0),
  vec2<f32>(0.0, 1.0),
  vec2<f32>(1.0, 0.0),
  vec2<f32>(1.0, 0.0),
  vec2<f32>(0.0, 1.0),
  vec2<f32>(1.0, 1.0)
);

@vertex
fn vs_main(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
  var output: VertexOutput;

  let cellX = f32(instanceIndex % gridParams.gridWidth);
  let cellY = f32(instanceIndex / gridParams.gridWidth);

  let cellData = cells[instanceIndex];
  let quadUV = pos[vertexIndex];

  let totalGridWidthPX = f32(gridParams.gridWidth) * gridParams.cellPixelWidth;
  let totalGridHeightPX = f32(gridParams.gridHeight) * gridParams.cellPixelHeight;

  let startXPX = (gridParams.viewportWidth - totalGridWidthPX) * 0.5 + (cellX + quadUV.x) * gridParams.cellPixelWidth;
  let startYPX = (gridParams.viewportHeight - totalGridHeightPX) * 0.5 + (cellY + quadUV.y) * gridParams.cellPixelHeight;

  let ndcX = (startXPX / gridParams.viewportWidth) * 2.0 - 1.0;
  let ndcY = 1.0 - (startYPX / gridParams.viewportHeight) * 2.0;

  output.position = vec4<f32>(ndcX, ndcY, 0.0, 1.0);

  let col = cellData.charIndex % gridParams.atlasCols;
  let row = cellData.charIndex / gridParams.atlasCols;

  let u = (f32(col) + quadUV.x) / f32(gridParams.atlasCols);
  let v = (f32(row) + quadUV.y) / f32(gridParams.atlasRows);

  output.uv = vec2<f32>(u, v);
  output.color = vec3<f32>(cellData.r, cellData.g, cellData.b);

  return output;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let texColor = textureSample(atlasTexture, atlasSampler, input.uv);
  let glyphMask = texColor.r;

  if (glyphMask < 0.05) {
    discard;
  }

  return vec4<f32>(input.color, glyphMask);
}
`;