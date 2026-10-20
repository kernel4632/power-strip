import { useLayoutEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
} from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

/**
 * 按法线主轴向把顶点位置投影成 UV，位置已经是合并坐标系里的米制坐标。
 * 原始 UV 在 boxGeometry 与 RoundedBox 之间的基向量并不一致，直接缩放会让
 * 木纹方向随机翻转；用投影则保证同一张 0.75 米的木纹在桌面、侧板、搁板上
 * 颗粒一致，且顺纹方向始终沿着构件最长的那个面轴。
 */
function projectUV(geometry: BufferGeometry, tile: number) {
  const position = geometry.getAttribute('position')
  const normal = geometry.getAttribute('normal')
  if (!position || !normal) return
  let uv = geometry.getAttribute('uv')
  if (!uv || uv.count !== position.count) {
    uv = new Float32BufferAttribute(new Float32Array(position.count * 2), 2)
    geometry.setAttribute('uv', uv)
  }
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i)
    const y = position.getY(i)
    const z = position.getZ(i)
    const nx = Math.abs(normal.getX(i))
    const ny = Math.abs(normal.getY(i))
    const nz = Math.abs(normal.getZ(i))
    let u: number
    let v: number
    if (ny >= nx && ny >= nz) {
      u = x
      v = z
    } else if (nx >= nz) {
      u = z
      v = y
    } else {
      u = x
      v = y
    }
    uv.setXY(i, u / tile, v / tile)
  }
  uv.needsUpdate = true
}

export function StaticGeometry({
  children,
  revision,
}: {
  children: ReactNode
  revision: boolean | number
}) {
  const source = useRef<Group>(null)
  const output = useRef<Group>(null)
  useLayoutEffect(() => {
    if (!source.current || !output.current) return
    const root = source.current
    const target = output.current
    root.updateWorldMatrix(true, true)
    const inverse = new Matrix4().copy(root.matrixWorld).invert()
    const batches = new Map<
      string,
      { material: MeshStandardMaterial; geometries: BufferGeometry[] }
    >()
    root.traverse((object) => {
      if (
        !(object instanceof Mesh) ||
        !(object.material instanceof MeshStandardMaterial)
      )
        return
      const material = object.material
      const key = [
        material.color.getHexString(),
        material.roughness,
        material.metalness,
        material.emissive.getHexString(),
        material.emissiveIntensity,
        material.map?.uuid,
        material.normalMap?.uuid,
        material.roughnessMap?.uuid,
        material.normalScale.x,
      ].join('|')
      let batch = batches.get(key)
      if (!batch) {
        batch = { material: material.clone(), geometries: [] }
        batches.set(key, batch)
      }
      const geometry = object.geometry.index
        ? object.geometry.toNonIndexed()
        : object.geometry.clone()
      geometry.applyMatrix4(
        new Matrix4().multiplyMatrices(inverse, object.matrixWorld),
      )
      // 投影放在合并坐标系里算：同一床位内的构件共用一套绝对米制坐标，
      // 相邻的桌面与桌沿因此纹路接得上，地砖之间又各不相同。
      const tile = material.map?.userData?.tile
      if (typeof tile === 'number' && tile > 0) projectUV(geometry, tile)
      batch.geometries.push(geometry)
    })
    const meshes: Mesh[] = []
    batches.forEach(({ material, geometries }) => {
      const geometry = mergeGeometries(geometries, false)
      geometries.forEach((item) => item.dispose())
      if (!geometry) {
        material.dispose()
        return
      }
      geometry.computeBoundingSphere()
      const mesh = new Mesh(geometry, material)
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.matrixAutoUpdate = false
      target.add(mesh)
      meshes.push(mesh)
    })
    root.visible = false
    return () => {
      root.visible = true
      meshes.forEach((mesh) => {
        target.remove(mesh)
        mesh.geometry.dispose()
        ;(mesh.material as MeshStandardMaterial).dispose()
      })
    }
  }, [revision])
  return (
    <>
      <group ref={source}>{children}</group>
      <group ref={output} />
    </>
  )
}
