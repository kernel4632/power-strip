export type ApplianceKind =
  | 'laptop'
  | 'monitor'
  | 'kettle'
  | 'lamp'
  | 'fridge'
  | 'phone'

export interface ApplianceSpec {
  kind: ApplianceKind
  label: string
  /** rated power draw in watts while running */
  ratedWatts: number
  /** idle draw in watts while plugged in but switched off */
  standbyWatts: number
  /** base colour used by the 3D model */
  color: string
}

export interface Outlet {
  id: number
  label: string
  /** appliance currently plugged into this socket, null when free */
  appliance: ApplianceSpec | null
  /** whether the plugged appliance is switched on */
  on: boolean
}
