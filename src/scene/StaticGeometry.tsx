import { useLayoutEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import {
  BufferGeometry,
  Group,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
} from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

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
        material.bumpMap?.uuid,
        material.bumpScale,
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
