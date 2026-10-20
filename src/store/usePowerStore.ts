import { create } from 'zustand'
import { DEVICE_CATALOG, DEVICE_MAP, STATIONS } from '../data/catalog'
import type {
  CameraView,
  DeviceId,
  DeviceState,
  InspectionPart,
  PowerSample,
  SceneMode,
  Selection,
  StationId,
} from '../types'

function initialDevices(): Record<DeviceId, DeviceState> {
  return Object.fromEntries(
    DEVICE_CATALOG.map((d) => [
      d.id,
      {
        on: d.defaultOn,
        level: 1,
        watts: d.defaultOn ? d.ratedWatts : d.standbyWatts,
        energyWh: 0,
      },
    ]),
  ) as Record<DeviceId, DeviceState>
}
interface PowerState {
  devices: Record<DeviceId, DeviceState>
  strips: Record<StationId, boolean>
  selected: Selection
  activeStation: StationId | null
  cutaway: boolean
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
  inspectionPart: InspectionPart
  inspectedDevice: DeviceId | null
  select: (id: Selection) => void
  selectStation: (id: StationId) => void
  closePanel: () => void
  toggle: (id: DeviceId) => void
  setLevel: (id: DeviceId, level: number) => void
  setMaster: (on: boolean) => void
  setStrip: (id: StationId, on: boolean) => void
  setMode: (mode: SceneMode) => void
  setView: (view: CameraView) => void
  focus: () => void
  inspect: (part: 'strip' | 'bed') => void
  toggleNight: () => void
  toggleFlow: () => void
  toggleLabels: () => void
  toggleRotate: () => void
  tick: (seconds: number, now: number) => void
}
export const usePowerStore = create<PowerState>()((set) => ({
  devices: initialDevices(),
  strips: { s1: true, s2: true, s3: true, s4: true },
  selected: null,
  activeStation: null,
  cutaway: true,
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
  inspectionPart: 'station',
  inspectedDevice: null,
  select: (selected) =>
    set((state) => ({
      selected,
      activeStation:
        selected && selected !== 'room'
          ? selected.includes('-')
            ? DEVICE_MAP[selected as DeviceId].stationId
            : (selected as StationId)
          : state.activeStation,
      autoRotate: false,
    })),
  selectStation: (activeStation) =>
    set((state) => ({
      selected: activeStation,
      activeStation,
      cutaway: true,
      autoRotate: false,
      inspectionPart: 'station',
      inspectedDevice: null,
      cameraRevision: state.cameraRevision + 1,
    })),
  closePanel: () => set({ selected: null }),
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
          level: Number.isFinite(level)
            ? Math.max(0.1, Math.min(1, level))
            : state.devices[id].level,
        },
      },
    })),
  setMaster: (masterOn) => set({ masterOn }),
  setStrip: (id, on) =>
    set((state) => ({ strips: { ...state.strips, [id]: on } })),
  setMode: (mode) =>
    set((state) => ({
      mode,
      masterOn: true,
      strips: { s1: true, s2: true, s3: true, s4: true },
      night: mode === 'relax',
      devices: Object.fromEntries(
        DEVICE_CATALOG.map((d) => [
          d.id,
          {
            ...state.devices[d.id],
            on:
              mode === 'away'
                ? false
                : mode === 'relax'
                  ? ['lamp', 'speaker', 'fan', 'humidifier', 'phone'].includes(
                      d.kind,
                    )
                  : d.defaultOn,
            level: mode === 'relax' && d.kind === 'lamp' ? 0.4 : 1,
          },
        ]),
      ) as Record<DeviceId, DeviceState>,
    })),
  setView: (cameraView) =>
    set((state) => ({
      cameraView,
      selected: null,
      activeStation: null,
      inspectionPart: 'station',
      inspectedDevice: null,
      autoRotate: false,
      cameraRevision: state.cameraRevision + 1,
    })),
  focus: () =>
    set((state) => {
      if (!state.selected?.includes('-')) return state
      return {
        inspectedDevice: state.selected as DeviceId,
        cameraRevision: state.cameraRevision + 1,
        inspectionPart: 'device',
        autoRotate: false,
        cutaway: true,
      }
    }),
  inspect: (inspectionPart) =>
    set((state) => ({
      inspectionPart,
      inspectedDevice: null,
      cutaway: inspectionPart !== 'bed',
      cameraRevision: state.cameraRevision + 1,
      autoRotate: false,
    })),
  toggleNight: () => set((state) => ({ night: !state.night })),
  toggleFlow: () => set((state) => ({ energyFlow: !state.energyFlow })),
  toggleLabels: () => set((state) => ({ labels: !state.labels })),
  toggleRotate: () => set((state) => ({ autoRotate: !state.autoRotate })),
  tick: (seconds, now) =>
    set((state) => {
      const dt = Math.min(
        Math.max(Number.isFinite(seconds) ? seconds : 0, 0),
        5,
      )
      const elapsed = state.sessionSeconds + dt
      const devices = { ...state.devices }
      const readings = {} as Record<DeviceId, number>
      const stations = Object.fromEntries(
        STATIONS.map((s) => [s.id, 0]),
      ) as Record<StationId, number>
      let total = 0
      DEVICE_CATALOG.forEach((spec, index) => {
        const device = state.devices[spec.id]
        const powered = state.masterOn && state.strips[spec.stationId]
        const wave = 0.97 + 0.03 * Math.sin(elapsed * 0.7 + index * 2)
        const target = !powered
          ? 0
          : device.on
            ? spec.ratedWatts * device.level * wave
            : spec.standbyWatts
        const watts =
          !powered || !device.on
            ? target
            : device.watts + (target - device.watts) * (1 - Math.exp(-dt * 2.5))
        devices[spec.id] = {
          ...device,
          watts,
          energyWh:
            device.energyWh + (((device.watts + watts) / 2) * dt) / 3600,
        }
        readings[spec.id] = watts
        stations[spec.stationId] += watts
        total += watts
      })
      return {
        devices,
        sessionSeconds: elapsed,
        history: [
          ...state.history,
          { time: now, total, devices: readings, stations },
        ].slice(-90),
      }
    }),
}))
