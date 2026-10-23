import type { ReactNode } from 'react'
import type { Point3 } from '../types'

export interface PartCheck {
  /** Coordinates are relative to the containing station, or the room for shared props. */
  supportY?: number
  min?: Point3
  max?: Point3
  category?: 'prop' | 'solid'
}

/** Keep an audit boundary before static meshes are batched. No debug geometry is drawn. */
export function ModelPart({
  id,
  check,
  children,
  position,
  rotation,
}: {
  id: string
  check: PartCheck
  children: ReactNode
  position?: Point3
  rotation?: Point3
}) {
  return (
    <group
      name={`check-${id}`}
      position={position}
      rotation={rotation}
      userData={{ modelCheck: check }}
    >
      {children}
    </group>
  )
}
