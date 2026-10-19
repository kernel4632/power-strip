import { create } from 'zustand'
import { DEVICE_CATALOG } from '../data/catalog'
import type {
  CameraView,
  DeviceId,
  DeviceState,
  PowerSample,
  SceneMode,
} from '../types'

function initialDevices(): Record<DeviceId, DeviceState> {
  return Object.fromEntries(
    DEVICE_CATALOG.map((device) => {
      const on = ['laptop', 'monitor', 'lamp', 'fridge', 'phone'].includes(
        device.id,
      )
      const level = device.id === 'lamp' ? 0.75 : 1
      return [
        device.id,
        {
          on,
          level,
          watts: on ? device.ratedWatts * level : device.standbyWatts,
          energyWh: 0,
        },
      ]
    }),
  ) as Record<DeviceId, DeviceState>
}

interface PowerState {
  devices: Record<DeviceId, DeviceState>
  selected: DeviceId | 'strip' | null
  history: PowerSample[]
  sessionSeconds: number
  masterOn: boolean
  mode: SceneMode
  night: boolean
  energyFlow: boolean
  labels: boolean
  autoRotate: boolean
  cameraView: CameraView
  cameraRevision: number
  select: (id: DeviceId | 'strip' | null) => void
  toggle: (id: DeviceId) => void
  setLevel: (id: DeviceId, level: number) => void
  setMaster: (on: boolean) => void
  setMode: (mode: SceneMode) => void
  setView: (view: CameraView) => void
  focus: () => void
  toggleNight: () => void
  toggleFlow: () => void
  toggleLabels: () => void
  toggleRotate: () => void
  tick: (seconds: number, now: number) => void
}

export const usePowerStore = create<PowerState>()((set) => ({
  devices: initialDevices(),
  selected: null,
  history: [],
  sessionSeconds: 0,
  masterOn: true,
  mode: 'study',
  night: false,
  energyFlow: false,
  labels: true,
  autoRotate: false,
  cameraView: 'overview',
  cameraRevision: 0,
  select: (selected) => set({ selected, autoRotate: false }),
  toggle: (id) =>
    set((state) => ({
      devices: {
        ...state.devices,
        [id]: { ...state.devices[id], on: !state.devices[id].on },
      },
    })),
  setLevel: (id, level) =>
    set((state) => ({
      devices: {
        ...state.devices,
        [id]: {
          ...state.devices[id],
          level: Math.max(0.1, Math.min(1, level)),
        },
      },
    })),
  setMaster: (masterOn) => set({ masterOn }),
  setMode: (mode) =>
    set((state) => ({
      mode,
      night: mode === 'relax',
      masterOn: true,
      devices: Object.fromEntries(
        DEVICE_CATALOG.map(({ id }) => {
          const on =
            mode === 'away'
              ? id === 'fridge'
              : mode === 'relax'
                ? ['lamp', 'phone', 'fridge', 'fan'].includes(id)
                : ['laptop', 'monitor', 'lamp', 'phone', 'fridge'].includes(id)
          return [
            id,
            {
              ...state.devices[id],
              on,
              level:
                id === 'lamp'
                  ? mode === 'relax'
                    ? 0.35
                    : 0.75
                  : id === 'fan'
                    ? 0.5
                    : 1,
            },
          ]
        }),
      ) as Record<DeviceId, DeviceState>,
    })),
  setView: (cameraView) =>
    set((state) => ({
      cameraView,
      selected: null,
      autoRotate: false,
      cameraRevision: state.cameraRevision + 1,
    })),
  focus: () =>
    set((state) => ({
      cameraRevision: state.cameraRevision + 1,
      autoRotate: false,
    })),
  toggleNight: () => set((state) => ({ night: !state.night })),
  toggleFlow: () => set((state) => ({ energyFlow: !state.energyFlow })),
  toggleLabels: () => set((state) => ({ labels: !state.labels })),
  toggleRotate: () => set((state) => ({ autoRotate: !state.autoRotate })),
  tick: (seconds, now) =>
    set((state) => {
      const dt = Math.min(Math.max(seconds, 0), 5)
      const elapsed = state.sessionSeconds + dt
      const devices = { ...state.devices }
      const sample = {} as Record<DeviceId, number>
      let total = 0
      DEVICE_CATALOG.forEach((spec, index) => {
        const device = state.devices[spec.id]
        const wave = 0.97 + 0.03 * Math.sin(elapsed * 0.7 + index * 2)
        const cycle =
          spec.id === 'fridge'
            ? 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(elapsed * 0.08))
            : 1
        const target = !state.masterOn
          ? 0
          : device.on
            ? spec.ratedWatts * device.level * wave * cycle
            : spec.standbyWatts
        const watts =
          !state.masterOn || !device.on
            ? target
            : device.watts + (target - device.watts) * (1 - Math.exp(-dt * 2.5))
        devices[spec.id] = {
          ...device,
          watts,
          energyWh:
            device.energyWh + (((device.watts + watts) / 2) * dt) / 3600,
        }
        sample[spec.id] = watts
        total += watts
      })
      return {
        devices,
        sessionSeconds: elapsed,
        history: [
          ...state.history,
          { time: now, total, devices: sample },
        ].slice(-90),
      }
    }),
}))
