import { useEffect, useState } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'
import type { StationId } from '../types'
import { Box } from './Geometry'
import { createPillowGeometry, createQuiltGeometry } from './clothGeometry'

const COLORS = [
  { quilt: '#405763', sheet: '#ddd7c9', pillow: '#eee7d7', check: true },
  { quilt: '#9b6552', sheet: '#dbcfbc', pillow: '#e6ddca', check: false },
  { quilt: '#6d7b68', sheet: '#d8d8c9', pillow: '#e9e2d3', check: false },
  { quilt: '#748792', sheet: '#dbd9cb', pillow: '#e5ddcb', check: true },
]

function clothTexture(check: boolean) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 512
  const c = canvas.getContext('2d')!
  c.fillStyle = '#f6f6f4'
  c.fillRect(0, 0, 512, 512)
  const grain = c.createImageData(512, 512)
  for (let i = 0; i < grain.data.length; i += 4) {
    const value = 243 + ((i * 13 + Math.floor(i / 2048) * 31) % 7)
    grain.data[i] = value
    grain.data[i + 1] = value
    grain.data[i + 2] = value - 1
    grain.data[i + 3] = 255
  }
  c.putImageData(grain, 0, 0)
  if (check) {
    c.fillStyle = '#bec5c3'
    for (let i = 16; i < 512; i += 64) {
      c.fillRect(i, 0, 2, 512)
      c.fillRect(0, i, 512, 2)
      c.fillRect(i + 7, 0, 1, 512)
      c.fillRect(0, i + 7, 512, 1)
    }
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

/** Replaces disconnected boxes and fake crease bars with two closed, continuous cloth surfaces. */
export function Bedding({ stationId }: { stationId: StationId }) {
  const seed = Number(stationId.slice(1)) - 1
  const color = COLORS[seed]
  const [quilt] = useState(() => createQuiltGeometry(seed))
  const [pillow] = useState(() => createPillowGeometry(seed))
  const [texture] = useState(() => clothTexture(color.check))
  const [pillowTexture] = useState(() => clothTexture(false))
  useEffect(
    () => () => {
      quilt.dispose()
      pillow.dispose()
      texture.dispose()
      pillowTexture.dispose()
    },
    [quilt, pillow, texture, pillowTexture],
  )
  return (
    <group name={`bedding-${stationId}`}>
      <Box
        size={[2.36, 0.12, 1.01]}
        position={[0, 2.1, 0]}
        color={color.sheet}
        round={0.032}
        roughness={0.98}
        surface="fabric"
      />
      <mesh
        name={`quilt-${stationId}`}
        geometry={quilt}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={color.quilt}
          map={texture}
          roughness={0.98}
        />
      </mesh>
      <mesh
        name={`pillow-${stationId}`}
        geometry={pillow}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={color.pillow}
          map={pillowTexture}
          roughness={1}
        />
      </mesh>
    </group>
  )
}
