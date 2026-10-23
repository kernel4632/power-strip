import type { DeviceSpec, Point3 } from '../types'

/** The smaller tablet kept the old, larger model's port offset after the data merge. */
export function cablePort(spec: DeviceSpec): Point3 {
  if (spec.kind === 'tablet') return [0, 0.012, -0.155 * spec.scale]
  return spec.cablePort
}
