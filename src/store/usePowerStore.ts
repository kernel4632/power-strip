import { create } from 'zustand'
import {
  DEVICE_CATALOG,
  DEVICE_MAP,
  STATIONS,
  deviceReading,
  measuredOnlyWatts,
} from '../data/catalog'
import { measuredIndex as intervalAt } from '../lib/measuredTime'
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

/** 页面打开时所处的实测区间，用作设备功率的初值。 */
const BOOT_AT = new Date()
const BOOT_INDEX = intervalAt(BOOT_AT)

function initialDevices(): Record<DeviceId, DeviceState> {
  return Object.fromEntries(
    DEVICE_CATALOG.map((d) => {
      const reading = deviceReading(d, BOOT_AT)
      return [
        d.id,
        {
          on: d.defaultOn,
          level: 1,
          watts: d.defaultOn ? reading.watts : d.standbyWatts,
          energyWh: 0,
          powerSource: reading.source,
        },
      ]
    }),
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
  /** 当前所处的实测十分钟区间序号 */
  measuredIndex: number
  /** 场景外设备在该区间的实测合计功率 */
  outsideWatts: number
  /** 场景外设备在本次会话内的累计电量 */
  outsideEnergyWh: number
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
  measuredIndex: BOOT_INDEX,
  outsideWatts: measuredOnlyWatts(BOOT_AT),
  outsideEnergyWh: 0,
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
      const at = new Date(now)
      const index = intervalAt(at)
      const devices = { ...state.devices }
      const readings = {} as Record<DeviceId, number>
      const stations = Object.fromEntries(
        STATIONS.map((s) => [s.id, 0]),
      ) as Record<StationId, number>
      let scene = 0
      DEVICE_CATALOG.forEach((spec) => {
        const device = state.devices[spec.id]
        const powered = state.masterOn && state.strips[spec.stationId]
        const reading = deviceReading(spec, at)
        const target = !powered
          ? 0
          : device.on
            ? reading.watts * device.level
            : spec.standbyWatts
        const watts =
          !powered || !device.on
            ? target
            : device.watts + (target - device.watts) * (1 - Math.exp(-dt * 2.5))
        devices[spec.id] = {
          ...device,
          watts,
          powerSource: reading.source,
          energyWh:
            device.energyWh + (((device.watts + watts) / 2) * dt) / 3600,
        }
        readings[spec.id] = watts
        stations[spec.stationId] += watts
        scene += watts
      })
      const outside = measuredOnlyWatts(at)
      return {
        devices,
        measuredIndex: index,
        outsideWatts: outside,
        outsideEnergyWh:
          state.outsideEnergyWh + (((state.outsideWatts + outside) / 2) * dt) / 3600,
        sessionSeconds: elapsed,
        history: [
          ...state.history,
          {
            time: now,
            total: scene + outside,
            devices: readings,
            stations,
            outside,
          },
        ].slice(-90),
      }
    }),
}))
