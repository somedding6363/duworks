export type ParticleSphere = {
  destroy: () => void;
  resize: () => void;
  setActive: (active: boolean) => void;
  /**
   * spread: 점에서 구로 퍼지는 정도(0~1), morph: 구에서 원통으로 바뀌는 정도(0~1),
   * flow: 원통이 위로 흐른 서비스 칸 수.
   */
  setProgress: (progress: { spread: number; morph: number; flow: number }) => void;
};

// 구·원통 배치는 처음에 한 번만 GPU에 올리고, 스크롤 중에는 진행도 값만 넘긴다.
const vertexShader = `
precision highp float;
attribute vec3 aSphere;
attribute vec3 aCylinder;
attribute float aSeed;
uniform float uTime;
uniform float uSpread;
uniform float uMorph;
uniform float uFlow;
uniform float uAspect;
uniform float uPointScale;
varying float vAlpha;
varying float vTone;

vec3 rotateY(vec3 p, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return vec3(p.x * c - p.z * s, p.y, p.x * s + p.z * c);
}

vec3 rotateX(vec3 p, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return vec3(p.x, p.y * c - p.z * s, p.y * s + p.z * c);
}

void main() {
  // 가운데 점에서 바깥으로 고르게 퍼진다. 입자마다 퍼지는 때를 조금씩 다르게 둔다.
  float spread = smoothstep(aSeed * 0.3, aSeed * 0.3 + 0.7, uSpread);
  vec3 sphere = rotateX(rotateY(aSphere * spread, uTime * 0.07), 0.35);
  // 찌그러지지 않게 세 방향을 같은 비율로 키운다. 가로 폭을 화면의 90%에 맞추되,
  // 넓은 화면에서 위아래가 넘치지 않도록 높이 기준도 함께 본다. 울퉁불퉁한 부분이 튀어나오므로 85%로 잡는다.
  // 카메라 거리 3.4, 초점 1.9에서 반지름 R인 구의 외곽이 화면 좌표 T가 되는 R = T * 3.4 / sqrt(1.9² + T²).
  float target = 0.85 * min(uAspect, 1.0);
  float sphereRadius = target * 3.4 / sqrt(1.9 * 1.9 + target * target);
  sphere *= sphereRadius / 1.15;

  // 원통은 3D 공간에서 반지름을 고정해 원근이 자연스럽게 두고, 화면에 그릴 때 가로만 늘려 폭을 맞춘다.
  // 반지름을 화면 비율로 키우면 넓고 낮은 화면에서 앞면이 카메라에 너무 가까워져 모양이 흐트러진다.
  float radiusScale = 0.8;
  // 원통 외곽(깊이 0 부근)이 화면 폭의 70%가 되는 가로 배율.
  float cylinderStretch = 0.7 * uAspect / (radiusScale * (1.9 / 3.4));
  float height = 1.7;
  vec3 cylinder = aCylinder;
  // 서비스 한 칸마다 점들이 위로 흐르며 돈다. 맨 위를 넘으면 아래에서 다시 나온다.
  cylinder.y = mod(cylinder.y + uFlow * 0.9 + height, height * 2.0) - height;
  cylinder = rotateY(cylinder, uTime * 0.15 + uFlow * 0.6);
  cylinder.xz *= radiusScale;

  // 입자마다 조금씩 다른 때에 원통 자리로 옮겨 간다.
  float morph = smoothstep(aSeed * 0.4, aSeed * 0.4 + 0.6, uMorph);
  vec3 p = mix(sphere, cylinder, morph);

  float depth = p.z + 3.4;
  float projection = 1.9 / depth;
  float stretch = mix(1.0, cylinderStretch, morph);
  gl_Position = vec4(p.x * projection / uAspect * stretch, p.y * projection, 0.0, 1.0);
  gl_PointSize = uPointScale * projection * (0.6 + aSeed * 0.9);
  // 원통 위아래 끝에서는 흐리게 해, 흐르며 다시 나올 때 튀지 않게 한다.
  float edge = mix(1.0, 1.0 - smoothstep(height - 0.3, height, abs(cylinder.y)), morph);
  vAlpha = (0.35 + 0.65 * smoothstep(-1.6, 1.2, p.z)) * smoothstep(0.0, 0.08, uSpread) * edge;
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
  // 밝은 크림 배경 위에서 보이도록 청록과 짙은 청록 사이로 칠한다.
  vec3 teal = vec3(0.078, 0.722, 0.651);
  vec3 deep = vec3(0.035, 0.29, 0.27);
  vec3 color = mix(teal, deep, smoothstep(0.35, 0.9, vTone));
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
  const sphere = new Float32Array(count * 3);
  const cylinder = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const sphereRadius = 1.15;
  // 반지름 1 기준으로 두고, 실제 크기는 셰이더가 화면 비율에 맞춰 정한다.
  const cylinderRadius = 1;
  const cylinderHeight = 1.7;

  for (let index = 0; index < count; index += 1) {
    const seed = random(index, 1);
    seeds[index] = seed;

    // 울퉁불퉁한 구: 피보나치 배치로 표면에 고르게 두고, 반지름을 물결처럼 흔들고 약간의 두께를 준다.
    const y = 1 - ((index + 0.5) / count) * 2;
    const ring = Math.sqrt(1 - y * y);
    const theta = goldenAngle * index;
    const phi = Math.acos(y);
    const bump =
      0.12 * Math.sin(theta * 3 + 0.7) * Math.sin(phi * 4) + 0.06 * Math.sin(phi * 7 + theta);
    const shell = sphereRadius * (1 + bump + (random(index, 2) - 0.5) * 0.08);
    sphere[index * 3] = Math.cos(theta) * ring * shell;
    sphere[index * 3 + 1] = y * shell;
    sphere[index * 3 + 2] = Math.sin(theta) * ring * shell;

    // 울퉁불퉁한 원통: 둘레 각도와 높이에 따라 반지름을 물결처럼 흔들고 약간의 두께를 준다.
    const angle = goldenAngle * index;
    const t = (index + 0.5) / count;
    const wave =
      0.14 * Math.sin(angle * 3 + t * 11) * Math.sin(t * 17 + 0.4) +
      0.07 * Math.sin(angle * 5 - t * 23);
    const radius = cylinderRadius * (1 + wave + (random(index, 6) - 0.5) * 0.1);
    cylinder[index * 3] = Math.cos(angle) * radius;
    cylinder[index * 3 + 1] = (t * 2 - 1) * cylinderHeight;
    cylinder[index * 3 + 2] = Math.sin(angle) * radius;
  }

  return { sphere, cylinder, seeds };
}

export function createParticleSphere(
  canvas: HTMLCanvasElement,
  count: number,
  maxPixelRatio: number,
): ParticleSphere | null {
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

  const { sphere, cylinder, seeds } = createPositions(count);
  const buffers = [
    { data: sphere, name: "aSphere", size: 3 },
    { data: cylinder, name: "aCylinder", size: 3 },
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
  const spreadLocation = gl.getUniformLocation(program, "uSpread");
  const morphLocation = gl.getUniformLocation(program, "uMorph");
  const flowLocation = gl.getUniformLocation(program, "uFlow");
  const aspectLocation = gl.getUniformLocation(program, "uAspect");
  const pointScaleLocation = gl.getUniformLocation(program, "uPointScale");

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  let progress = { spread: 0, morph: 0, flow: 0 };
  let active = false;
  let frame = 0;
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
    gl.uniform1f(pointScaleLocation, Math.min(width, height) * 0.011);
  };

  const render = (now: number) => {
    frame = 0;
    if (!active) return;
    gl.uniform1f(timeLocation, (now - startedAt) / 1000);
    gl.uniform1f(spreadLocation, progress.spread);
    gl.uniform1f(morphLocation, progress.morph);
    gl.uniform1f(flowLocation, progress.flow);
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
