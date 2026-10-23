import { useEffect, useState } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'
import type { Point3 } from '../types'

/** Printed paper belongs to the room, not the app UI. Positions refer to the paper face. */
export function ScenePrint({
  kind,
  position,
  name,
}: {
  kind: 'name' | 'schedule' | 'safety'
  position: Point3
  name?: string
}) {
  const [texture] = useState(() => {
    const canvas = document.createElement('canvas')
    canvas.width = kind === 'name' ? 256 : 384
    canvas.height = kind === 'name' ? 128 : 512
    const c = canvas.getContext('2d')!
    c.fillStyle = '#e9e1cf'
    c.fillRect(0, 0, canvas.width, canvas.height)
    if (kind === 'name') {
      c.strokeStyle = '#b5aa93'
      c.lineWidth = 4
      c.strokeRect(4, 4, 248, 120)
      c.fillStyle = '#404940'
      c.font = '700 76px serif'
      c.textAlign = 'center'
      c.fillText(name ?? '', 128, 92)
    } else if (kind === 'schedule') {
      c.fillStyle = '#465b4f'
      c.font = '700 34px sans-serif'
      c.fillText('课程表', 24, 52)
      c.font = '16px sans-serif'
      c.fillText('2026 秋季 · 302', 24, 82)
      ;['一', '二', '三', '四', '五'].forEach((day, i) =>
        c.fillText(day, 71 + i * 60, 112),
      )
      ;['高数', '英语', '电路', '实验', '体育'].forEach((label, row) => {
        c.fillStyle = '#69776b'
        c.fillText(label, 9, 158 + row * 62)
        for (let col = 0; col < 5; col++) {
          c.strokeStyle = '#b4ad97'
          c.strokeRect(58 + col * 60, 134 + row * 62, 52, 42)
          c.fillStyle =
            (col + row * 2) % 4
              ? '#f2ebda'
              : ['#b1bba7', '#c5a98a', '#9eafb3'][(col + row) % 3]
          c.fillRect(60 + col * 60, 136 + row * 62, 48, 38)
        }
      })
    } else {
      c.fillStyle = '#a75342'
      c.fillRect(0, 0, 384, 100)
      c.fillStyle = '#f1e5ce'
      c.font = '700 36px sans-serif'
      c.fillText('宿舍安全用电', 28, 64)
      c.font = '24px sans-serif'
      c.fillStyle = '#4b5148'
      ;['人走断电', '不私拉乱接', '不使用大功率电器', '发现异常先断电'].forEach(
        (line, i) => c.fillText(`· ${line}`, 28, 172 + i * 72),
      )
      c.font = '16px sans-serif'
      c.fillText('后勤保障处 · 2026', 28, 478)
    }
    const map = new CanvasTexture(canvas)
    map.colorSpace = SRGBColorSpace
    return map
  })
  useEffect(() => () => texture.dispose(), [texture])
  const size =
    kind === 'name'
      ? [0.14, 0.07]
      : kind === 'schedule'
        ? [0.25, 0.34]
        : [0.24, 0.33]
  return (
    <mesh position={position} receiveShadow>
      <planeGeometry args={[size[0], size[1]]} />
      <meshStandardMaterial map={texture} roughness={1} />
    </mesh>
  )
}
