import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'

export type Surface = 'wood' | 'fabric' | 'plaster'
const textures = new Map<Surface, CanvasTexture>()

// Deterministic shared textures keep every model self-contained and offline-ready.
export function surfaceTexture(surface: Surface): CanvasTexture {
  const cached = textures.get(surface)
  if (cached) return cached
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const context = canvas.getContext('2d')!
  const image = context.createImageData(256, 256)
  for (let y = 0; y < 256; y++)
    for (let x = 0; x < 256; x++) {
      const noise =
        (((Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1) + 1) % 1
      const grain = Math.sin(
        x * 0.8 +
          Math.sin(y * 0.025) * 1.4 +
          Math.sin(x * 0.06 + y * 0.015) * 2,
      )
      const weave = (x % 4 < 2 ? 1 : -1) * (y % 4 < 2 ? 1 : -1)
      const value =
        surface === 'wood'
          ? 231 + grain * 10 + noise * 9
          : surface === 'fabric'
            ? 232 + weave * 10 + noise * 9
            : 243 + noise * 10
      const index = (y * 256 + x) * 4
      image.data[index] = value
      image.data[index + 1] = value
      image.data[index + 2] = value
      image.data[index + 3] = 255
    }
  context.putImageData(image, 0, 0)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = texture.wrapT = RepeatWrapping
  texture.repeat.set(surface === 'fabric' ? 3 : 1, surface === 'fabric' ? 3 : 1)
  texture.anisotropy = 4
  textures.set(surface, texture)
  return texture
}
