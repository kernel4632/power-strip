import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'

/**
 * 程序化材质：每个表面同时生成颜色、法线、粗糙度三张图。
 * 全部在本地用 canvas 生成，不请求外部贴图，保持场景自包含。
 * 颜色图保持接近中性（围绕 235 波动），色相仍由各构件的 color 决定，
 * 这样整套场景配色不变，纹理只负责表面细节与凹凸。
 */
export type Surface = 'wood' | 'fabric' | 'plaster' | 'paint' | 'lacquer'

type SurfaceMaps = {
  map: CanvasTexture
  normalMap: CanvasTexture
  roughnessMap: CanvasTexture
  normalScale: number
}

/**
 * 一张贴图在真实世界里覆盖的边长（米）。UV 由 StaticGeometry 按构件实际尺寸
 * 归一化，所以同一张贴图在 2 米的桌面和 0.3 米的搁板上颗粒大小一致。
 */
export const TILE: Record<Surface, number> = {
  wood: 0.75,
  fabric: 0.25,
  plaster: 0.6,
  paint: 0.3,
  lacquer: 0.5,
}

const SIZE = 512
const cache = new Map<Surface, SurfaceMaps>()

// 整数哈希：比 sin 取小数快一个量级，减少贴图生成时的主线程卡顿
const hash = (x: number, y: number, seed: number) => {
  let h =
    Math.imul(x, 374761393) +
    Math.imul(y, 668265263) +
    Math.imul(seed, 1442695041)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
const smooth = (t: number) => t * t * (3 - 2 * t)

/**
 * 周期性 value noise。UV 归一化后一张贴图会被重复很多次，
 * 普通 fbm 在 u=1 与 u=0 处取值不同，会在每个 tile 边界留下网格状接缝。
 * 周期取整数、每层频率翻倍时周期同步翻倍，纹理因此可以无缝平铺。
 */
function pnoise(
  x: number,
  y: number,
  px: number,
  py: number,
  seed: number,
): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = smooth(x - xi)
  const yf = smooth(y - yi)
  const x0 = ((xi % px) + px) % px
  const y0 = ((yi % py) + py) % py
  const x1 = (x0 + 1) % px
  const y1 = (y0 + 1) % py
  const a = hash(x0, y0, seed)
  const b = hash(x1, y0, seed)
  const c = hash(x0, y1, seed)
  const d = hash(x1, y1, seed)
  return (a * (1 - xf) + b * xf) * (1 - yf) + (c * (1 - xf) + d * xf) * yf
}

function pfbm(
  x: number,
  y: number,
  px: number,
  py: number,
  octaves = 3,
  seed = 0,
): number {
  let value = 0
  let amplitude = 0.5
  let sum = 0
  for (let i = 0; i < octaves; i++) {
    value += pnoise(x, y, px, py, seed + i * 17) * amplitude
    sum += amplitude
    x *= 2
    y *= 2
    px *= 2
    py *= 2
    amplitude *= 0.5
  }
  return value / sum
}

/** 返回 [亮度偏移, 高度 0..1, 粗糙度偏移]，取值在 -1..1 / 0..1 之间。 */
function sampleSurface(surface: Surface, x: number, y: number) {
  const u = x / SIZE
  const v = y / SIZE
  if (surface === 'wood') {
    // 一个 tile 内拼 3 块板：板缝沿 u 方向，每条板各带独立的年轮相位。
    // 纹理尺度按「总览距离下还能读出来」定：板缝约 8mm、年轮约 6cm，
    // 再细的线会被 mipmap 平均成一片糊。
    const plank = v * 3
    const index = Math.floor(plank)
    const pv = plank - index
    const phase = hash(index, 0, 33) * 6.283
    const seam = Math.pow(1 - Math.min(1, Math.min(pv, 1 - pv) / 0.05), 2)
    const warp =
      Math.sin(u * Math.PI * 2 * 2 + phase) * 0.018 +
      pfbm(u * 3, pv * 2, 3, 2, 3, 11) * 0.055 +
      pfbm(u * 13, pv * 4, 13, 4, 2, 19) * 0.014
    const rings = 0.5 + 0.5 * Math.sin((pv + warp) * Math.PI * 2 * 4 + phase)
    const ring = Math.pow(rings, 1.8)
    // 导管孔：低频沿 u、高频沿 pv，才会拉出顺纹的细长纹理
    const pore = pfbm(u * 4, pv * 60, 4, 60, 2, 3)
    const fleck = pfbm(u * 12, pv * 160, 12, 160, 2, 7)
    return {
      tone: -(ring * 0.5 + pore * 0.12 + fleck * 0.05 + seam * 0.85),
      height: 1 - ring * 0.45 - pore * 0.3 - fleck * 0.12 - seam * 0.7,
      rough: ring * 0.2 + pore * 0.14 + seam * 0.18,
    }
  }
  if (surface === 'fabric') {
    const warpThread = Math.sin(u * Math.PI * 2 * 64) * 0.5 + 0.5
    const weftThread = Math.sin(v * Math.PI * 2 * 64 + 1.2) * 0.5 + 0.5
    const twill = (Math.floor(u * 64) + Math.floor(v * 64)) % 4 < 2 ? 1 : 0.55
    const fuzz = pfbm(u * 90, v * 90, 90, 90, 2, 5)
    const weave = warpThread * weftThread * twill
    return {
      tone: -(1 - weave) * 0.17 + fuzz * 0.1,
      height: weave * 0.75 + fuzz * 0.25,
      rough: -(weave - 0.5) * 0.1,
    }
  }
  if (surface === 'plaster') {
    const coarse = pfbm(u * 6, v * 6, 6, 6, 4, 2)
    const fine = pfbm(u * 54, v * 54, 54, 54, 2, 9)
    return {
      tone: (coarse - 0.5) * 0.12 + (fine - 0.5) * 0.1,
      height: coarse * 0.6 + fine * 0.4,
      rough: (coarse - 0.5) * 0.1,
    }
  }
  if (surface === 'paint') {
    // 喷涂漆面：极细橘皮 + 轻微流平痕迹
    const peel = pfbm(u * 40, v * 40, 40, 40, 2, 13)
    return {
      tone: (peel - 0.5) * 0.05,
      height: peel * 0.12,
      rough: (peel - 0.5) * 0.06 + 0.02,
    }
  }
  // lacquer：高光哑光交替，接近平整
  const sheen = pfbm(u * 3, v * 3, 3, 3, 2, 21)
  return {
    tone: (sheen - 0.5) * 0.035,
    height: sheen * 0.08,
    rough: (sheen - 0.5) * 0.08,
  }
}

function makeCanvas() {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  return canvas
}

function toTexture(canvas: HTMLCanvasElement, srgb: boolean) {
  const texture = new CanvasTexture(canvas)
  if (srgb) texture.colorSpace = SRGBColorSpace
  texture.wrapS = texture.wrapT = RepeatWrapping
  texture.anisotropy = 8
  return texture
}

export function surfaceMaps(surface: Surface): SurfaceMaps {
  const cached = cache.get(surface)
  if (cached) return cached

  const height = new Float32Array(SIZE * SIZE)
  const color = makeCanvas()
  const colorContext = color.getContext('2d')!
  const colorImage = colorContext.createImageData(SIZE, SIZE)
  const rough = makeCanvas()
  const roughContext = rough.getContext('2d')!
  const roughImage = roughContext.createImageData(SIZE, SIZE)

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const sample = sampleSurface(surface, x, y)
      const index = y * SIZE + x
      height[index] = sample.height
      const base = 235 + sample.tone * 62
      const offset = index * 4
      colorImage.data[offset] = base
      colorImage.data[offset + 1] = base
      colorImage.data[offset + 2] = base
      colorImage.data[offset + 3] = 255
      const roughness = Math.max(
        0,
        Math.min(1, 1 - 0.35 + sample.rough * 0.8),
      )
      const value = roughness * 255
      roughImage.data[offset] = value
      roughImage.data[offset + 1] = value
      roughImage.data[offset + 2] = value
      roughImage.data[offset + 3] = 255
    }
  }
  colorContext.putImageData(colorImage, 0, 0)
  roughContext.putImageData(roughImage, 0, 0)

  // 由高度场求法线：Sobel 差分，环绕取样保证无缝
  const normal = makeCanvas()
  const normalContext = normal.getContext('2d')!
  const normalImage = normalContext.createImageData(SIZE, SIZE)
  const strength = surface === 'fabric' ? 5.5 : surface === 'wood' ? 3.2 : 1.6
  const at = (x: number, y: number) =>
    height[((y + SIZE) % SIZE) * SIZE + ((x + SIZE) % SIZE)]
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength
      const length = Math.hypot(dx, dy, 1)
      const offset = (y * SIZE + x) * 4
      normalImage.data[offset] = ((-dx / length) * 0.5 + 0.5) * 255
      normalImage.data[offset + 1] = ((-dy / length) * 0.5 + 0.5) * 255
      normalImage.data[offset + 2] = ((1 / length) * 0.5 + 0.5) * 255
      normalImage.data[offset + 3] = 255
    }
  }
  normalContext.putImageData(normalImage, 0, 0)

  const mapTexture = toTexture(color, true)
  const normalTexture = toTexture(normal, false)
  const roughnessTexture = toTexture(rough, false)
  // 贴图本身平铺 1×1，重复次数交给 UV（见 TILE），避免两套缩放互相打架
  for (const texture of [mapTexture, normalTexture, roughnessTexture])
    texture.userData.tile = TILE[surface]

  const maps: SurfaceMaps = {
    map: mapTexture,
    normalMap: normalTexture,
    roughnessMap: roughnessTexture,
    normalScale:
      surface === 'fabric' ? 0.9 : surface === 'wood' ? 0.85 : surface === 'paint' ? 0.18 : 0.3,
  }
  cache.set(surface, maps)
  return maps
}
