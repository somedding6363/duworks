export type ParticleStream = {
  destroy: () => void;
  resize: () => void;
  setActive: (active: boolean) => void;
  /**
   * spread: 점에서 파티클이 퍼지는 정도(0~1),
   * approach: 퍼진 파티클이 앞으로 나오기 시작하는 정도(0~1),
   * flow: 스크롤이 진행된 양. 이 값의 증감으로 앞뒤 방향을 정한다.
   */
  setProgress: (progress: { spread: number; approach: number; flow: number }) => void;
};

// 배치는 처음에 한 번만 GPU에 올리고, 스크롤 중에는 진행도 값만 넘긴다.
// 앞뒤 진행 속도(초당 주기 비율)와 스크롤 배율.
const forwardSpeed = 0.05;
const backwardSpeed = 0.09;
const scrollSpeed = 2;

const vertexShader = `
precision highp float;
attribute vec3 aField;
attribute float aSeed;
uniform float uTime;
uniform float uAngle;
uniform float uPhase;
uniform float uSpread;
uniform float uApproach;
uniform float uAspect;
uniform float uPointScale;
varying float vAlpha;
varying float vTone;

// 앞으로 나오는 거리. 이만큼 나오면 카메라를 지나 사라지고, 원래 깊이에서 다시 나타난다.
const float travel = 3.8;

void main() {
  // 구간이 겹치지 않게, 퍼지는 동안에는 회전만 하고(스크롤은 덩어리를 키운다) 그 뒤에는 앞으로만 나온다.
  // 회전 각도(uAngle)는 퍼지는 동안에만 쌓이므로 스크롤 방향과 무관하다.
  float approach = smoothstep(0.0, 0.2, uApproach);
  float settle = 1.0 - approach;

  // 1. 가운데 점에서 물결치듯 바깥으로 퍼진다.
  float wobble = sin(aField.x * 3.1 + uTime * 0.6) * sin(aField.y * 2.7 - uTime * 0.5)
    * sin(aField.z * 3.4 + uTime * 0.45);
  float spread = smoothstep(aSeed * 0.3, aSeed * 0.3 + 0.7, uSpread);
  float jitter = 0.88 + fract(aSeed * 7.31) * 0.24;
  // 기준 크기는 덩어리 외곽이 화면의 85%가 되는 반지름이다. 좁은 화면은 가로, 넓은 화면은 높이가 기준이다.
  // 카메라 거리 3.4, 초점 1.9에서 반지름 R인 덩어리의 외곽이 화면 좌표 T가 되는 R = T * 3.4 / sqrt(1.9² + T²).
  float target = 0.85 * min(uAspect, 1.0);
  float radius = target * 3.4 / sqrt(1.9 * 1.9 + target * target);
  // 퍼짐은 중간쯤에서 덩어리로 보이고, 끝에서는 기준의 1.5배까지 퍼져 화면을 가득 덮는다.
  float distance = spread * (0.6 + 0.9 * spread);
  vec3 field = aField * distance * (jitter + 0.14 * wobble * settle) * radius;
  float angle = uAngle;
  field = vec3(field.x * cos(angle) - field.z * sin(angle), field.y,
    field.x * sin(angle) + field.z * cos(angle));
  float tilt = 0.35;
  field = vec3(field.x, field.y * cos(tilt) - field.z * sin(tilt),
    field.y * sin(tilt) + field.z * cos(tilt));

  // 2. 퍼진 자리는 그대로 두고 앞뒤로만 움직인다. 파티클마다 시점이 달라 끊임없이 이어진다.
  // 앞뒤 진행(uPhase)은 스크롤 방향과 기본 속도를 합쳐 JS에서 계산한다.
  float phase = fract(aSeed * 7.31 + uPhase);
  vec3 p = field;
  p.z -= phase * travel * approach;

  float depth = max(p.z + 3.4, 0.05);
  float projection = 1.9 / depth;
  gl_Position = vec4(p.x * projection / uAspect, p.y * projection, 0.0, 1.0);
  // 카메라 코앞의 점이 큰 얼룩처럼 번지지 않도록 크기에 상한을 둔다.
  gl_PointSize = min(uPointScale * projection * (0.7 + aSeed * 0.8), uPointScale * 6.0);

  // 앞으로 나올 때는 나타나고 사라지는 순간이 튀지 않게 양 끝에서 흐려진다.
  // 카메라에 가까워지면 흐려져, 크게 번지기 전에 사라진다.
  float streamFade = smoothstep(0.0, 0.12, phase) * smoothstep(0.35, 1.3, depth);
  float fieldFade = 0.25 + 0.75 * smoothstep(-1.4, 1.2, p.z);
  vAlpha = mix(fieldFade, streamFade, approach) * smoothstep(0.0, 0.08, uSpread);
  vTone = aSeed;
}
`;

const fragmentShader = `
precision mediump float;
varying float vAlpha;
varying float vTone;

void main() {
  vec2 offset = gl_PointCoord - 0.5;
  float distance = length(offset);
  if (distance > 0.5) discard;
  float soft = 1.0 - smoothstep(0.15, 0.5, distance);
  // 어두운 배경 위에서 빛나도록 청록과 흰빛 사이로 칠한다.
  vec3 teal = vec3(0.078, 0.722, 0.651);
  vec3 glow = vec3(0.86, 0.98, 0.95);
  vec3 color = mix(teal, glow, smoothstep(0.35, 0.9, vTone));
  gl_FragColor = vec4(color * soft * vAlpha, soft * vAlpha);
}
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function random(index: number, salt: number) {
  const hash = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return hash - Math.floor(hash);
}

function createPositions(count: number) {
  const field = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let index = 0; index < count; index += 1) {
    seeds[index] = random(index, 1);

    // 퍼지는 방향: 구 표면에 고르게 둔다. 실제 거리는 셰이더가 진행도에 따라 늘린다.
    const y = 1 - ((index + 0.5) / count) * 2;
    const ring = Math.sqrt(1 - y * y);
    const theta = goldenAngle * index;
    field[index * 3] = Math.cos(theta) * ring;
    field[index * 3 + 1] = y;
    field[index * 3 + 2] = Math.sin(theta) * ring;
  }

  return { field, seeds };
}

export function createParticleStream(
  canvas: HTMLCanvasElement,
  count: number,
  maxPixelRatio: number,
): ParticleStream | null {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    premultipliedAlpha: true,
    powerPreference: "low-power",
  });
  if (!gl) return null;

  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexShader);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  const { field, seeds } = createPositions(count);
  const buffers = [
    { data: field, name: "aField", size: 3 },
    { data: seeds, name: "aSeed", size: 1 },
  ].map(({ data, name, size }) => {
    const buffer = gl.createBuffer();
    const location = gl.getAttribLocation(program, name);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
    return buffer;
  });

  const timeLocation = gl.getUniformLocation(program, "uTime");
  const angleLocation = gl.getUniformLocation(program, "uAngle");
  const phaseLocation = gl.getUniformLocation(program, "uPhase");
  const spreadLocation = gl.getUniformLocation(program, "uSpread");
  const approachLocation = gl.getUniformLocation(program, "uApproach");
  const aspectLocation = gl.getUniformLocation(program, "uAspect");
  const pointScaleLocation = gl.getUniformLocation(program, "uPointScale");

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  let progress = { spread: 0, approach: 0, flow: 0 };
  let active = false;
  let frame = 0;
  // 퍼지는 동안에만 쌓이는 회전 각도. 앞으로 나오기 시작하면 멈춘 각도를 유지한다.
  let angle = 0;
  // 앞뒤 진행. 스크롤을 올리면 뒤로, 다시 내리면 앞으로 향하고, 스크롤을 멈춰도 그 방향으로 계속 간다.
  let phase = 0;
  let lastFlow = 0;
  let forward = true;
  let lastFrameAt = performance.now();
  const startedAt = performance.now();

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, maxPixelRatio);
    const width = Math.round(canvas.clientWidth * ratio);
    const height = Math.round(canvas.clientHeight * ratio);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    gl.viewport(0, 0, width, height);
    gl.uniform1f(aspectLocation, width / Math.max(height, 1));
    gl.uniform1f(pointScaleLocation, Math.min(width, height) * 0.006);
  };

  const render = (now: number) => {
    frame = 0;
    if (!active) return;
    const delta = Math.min((now - lastFrameAt) / 1000, 0.1);
    lastFrameAt = now;
    angle += delta * 0.12 * (1 - Math.min(1, progress.approach / 0.2));

    // 스크롤한 만큼 움직이고, 마지막 스크롤 방향으로 계속 흐른다.
    const flowDelta = progress.flow - lastFlow;
    lastFlow = progress.flow;
    if (flowDelta !== 0) forward = flowDelta > 0;
    phase += flowDelta * scrollSpeed + delta * (forward ? forwardSpeed : -backwardSpeed);

    gl.uniform1f(timeLocation, (now - startedAt) / 1000);
    gl.uniform1f(angleLocation, angle);
    gl.uniform1f(phaseLocation, phase);
    gl.uniform1f(spreadLocation, progress.spread);
    gl.uniform1f(approachLocation, progress.approach);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, count);
    frame = window.requestAnimationFrame(render);
  };

  resize();

  return {
    resize,
    setProgress: (next) => {
      progress = next;
    },
    setActive: (value) => {
      active = value;
      if (active) lastFrameAt = performance.now();
      if (active && frame === 0) frame = window.requestAnimationFrame(render);
      if (!active) gl.clear(gl.COLOR_BUFFER_BIT);
    },
    destroy: () => {
      active = false;
      window.cancelAnimationFrame(frame);
      buffers.forEach((buffer) => gl.deleteBuffer(buffer));
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      gl.deleteProgram(program);
    },
  };
}
