import type { ApplianceKind } from '../types'

/** distance between two neighbouring sockets */
export const SPACING = 0.9
/** height of the power strip body */
export const OUTLET_HEIGHT = 0.3

export function socketX(index: number, count: number): number {
  return (index - (count - 1) / 2) * SPACING
}

/** hover height of an appliance above the desk, relative to the strip top */
export const APPLIANCE_HOVER: Record<ApplianceKind, number> = {
  laptop: 0.6,
  monitor: 0.95,
  kettle: 0.95,
  lamp: 0.85,
  fridge: 1.5,
  phone: 0.75,
}
