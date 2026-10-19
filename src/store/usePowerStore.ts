import { create } from 'zustand'
import { findSpec } from '../data/catalog'
import type { ApplianceSpec, Outlet } from '../types'

/** instantaneous draw of a socket in watts */
export function outletWatts(outlet: Outlet): number {
  if (!outlet.appliance) return 0
  return outlet.on ? outlet.appliance.ratedWatts : outlet.appliance.standbyWatts
}

export function totalWatts(outlets: Outlet[]): number {
  return outlets.reduce((sum, outlet) => sum + outletWatts(outlet), 0)
}

const DEFAULT_OUTLETS: Outlet[] = [
  { id: 0, label: '插座 1', appliance: findSpec('laptop'), on: true },
  { id: 1, label: '插座 2', appliance: findSpec('monitor'), on: true },
  { id: 2, label: '插座 3', appliance: findSpec('kettle'), on: false },
  { id: 3, label: '插座 4', appliance: null, on: false },
  { id: 4, label: '插座 5', appliance: null, on: false },
]

interface PowerState {
  outlets: Outlet[]
  plug: (outletId: number, spec: ApplianceSpec) => void
  unplug: (outletId: number) => void
  toggle: (outletId: number) => void
  reset: () => void
}

export const usePowerStore = create<PowerState>()((set) => ({
  outlets: DEFAULT_OUTLETS,
  plug: (outletId, spec) =>
    set((state) => ({
      outlets: state.outlets.map((outlet) =>
        outlet.id === outletId
          ? { ...outlet, appliance: spec, on: true }
          : outlet,
      ),
    })),
  unplug: (outletId) =>
    set((state) => ({
      outlets: state.outlets.map((outlet) =>
        outlet.id === outletId
          ? { ...outlet, appliance: null, on: false }
          : outlet,
      ),
    })),
  toggle: (outletId) =>
    set((state) => ({
      outlets: state.outlets.map((outlet) =>
        outlet.id === outletId ? { ...outlet, on: !outlet.on } : outlet,
      ),
    })),
  reset: () => set({ outlets: DEFAULT_OUTLETS }),
}))
