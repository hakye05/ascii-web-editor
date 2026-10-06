export const asciiShaderWGSL = /* wgsl */ `
struct Params {
  gridWidth: u32,
  gridHeight: u32,
  charCount: u32,
  pad: u32,
};

struct AdjustmentsParams {
  brightness: f32,   // Range: -1.0 to 1.0
  contrast: f32,     // Range: -1.0 to 1.0
  saturation: f32,   // Range: -1.0 to 1.0
  hueRotation: f32,  // Radians
  gamma: f32,        // Gamma exponent
};

struct CellOutput {
  charIndex: u32,
  r: f32,
  g: f32,
  b: f32,
};

@group(0) @binding(0) var inputTexture: texture_2d<f32>;
@group(0) @binding(1) var textureSampler: sampler;
@group(0) @binding(2) var<uniform> params: Params;
@group(0) @binding(3) var<storage, read> charLuminances: array<f32>;
@group(0) @binding(4) var<storage, read_write> outputCells: array<CellOutput>;
@group(0) @binding(5) var<uniform> adjParams: AdjustmentsParams;

// Helper: Convert RGB to HSV
fn rgb2hsv(c: vec3<f32>) -> vec3<f32> {
  let K = vec4<f32>(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  let p = mix(vec4<f32>(c.bg, K.wz), vec4<f32>(c.gb, K.xy), step(c.b, c.g));
  let q = mix(vec4<f32>(p.xyw, c.r), vec4<f32>(c.r, p.yzx), step(p.x, c.r));
  let d = q.x - min(q.w, q.y);
  let e = 1.0e-10;
  return vec3<f32>(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

// Helper: Convert HSV to RGB
fn hsv2rgb(c: vec3<f32>) -> vec3<f32> {
  let K = vec4<f32>(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  let p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, vec3<f32>(0.0), vec3<f32>(1.0)), c.y);
}

fn applyAdjustments(color: vec3<f32>) -> vec3<f32> {
  var col = color;

  // 1. Brightness
  col += vec3<f32>(adjParams.brightness);

  // 2. Contrast
  col = (col - 0.5) * (adjParams.contrast + 1.0) + 0.5;

  // 3. Hue & Saturation (HSV transformation)
  var hsv = rgb2hsv(clamp(col, vec3<f32>(0.0), vec3<f32>(1.0)));
  hsv.x = fract(hsv.x + adjParams.hueRotation / 6.28318530718);
  hsv.y = clamp(hsv.y * (adjParams.saturation + 1.0), 0.0, 1.0);
  col = hsv2rgb(hsv);

  // 4. Gamma Correction
  col = pow(max(col, vec3<f32>(0.0)), vec3<f32>(1.0 / max(adjParams.gamma, 0.0001)));

  return clamp(col, vec3<f32>(0.0), vec3<f32>(1.0));
}

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  if (global_id.x >= params.gridWidth || global_id.y >= params.gridHeight) {
    return;
  }

  let cellX = global_id.x;
  let cellY = global_id.y;
  let index = cellY * params.gridWidth + cellX;

  let minUV = vec2<f32>(
    f32(cellX) / f32(params.gridWidth),
    f32(cellY) / f32(params.gridHeight)
  );
  let maxUV = vec2<f32>(
    f32(cellX + 1u) / f32(params.gridWidth),
    f32(cellY + 1u) / f32(params.gridHeight)
  );

  var colorSum = vec3<f32>(0.0);
  let samplesPerAxis = 4u;
  let step = (maxUV - minUV) / f32(samplesPerAxis);

  for (var sx = 0u; sx < samplesPerAxis; sx++) {
    for (var sy = 0u; sy < samplesPerAxis; sy++) {
      let uv = minUV + vec2<f32>(f32(sx) + 0.5, f32(sy) + 0.5) * step;
      let sampledColor = textureSampleLevel(inputTexture, textureSampler, uv, 0.0).rgb;
      colorSum += sampledColor;
    }
  }

  let rawAvgColor = colorSum / f32(samplesPerAxis * samplesPerAxis);
  
  // Apply image adjustments to the sampled color
  let avgColor = applyAdjustments(rawAvgColor);

  let luminance = dot(avgColor, vec3<f32>(0.2126, 0.7152, 0.0722));

  var bestCharIdx = 0u;
  var minDiff = 100.0;

  for (var i = 0u; i < params.charCount; i++) {
    let diff = abs(charLuminances[i] - luminance);
    if (diff < minDiff) {
      minDiff = diff;
      bestCharIdx = i;
    }
  }

  outputCells[index].charIndex = bestCharIdx;
  outputCells[index].r = avgColor.r;
  outputCells[index].g = avgColor.g;
  outputCells[index].b = avgColor.b;
}
`;