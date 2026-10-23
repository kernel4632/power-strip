import { create } from 'zustand'
import { powerStep } from '../lib/power-step'
import {
  DEVICE_CATALOG,
  DEVICE_MAP,
  STATIONS,
} from '../data/catalog'
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
        watts: d.defaultOn ? d.referenceWatts : 0,
        energyWh: 0,
      },
    ]),
  ) as Record<DeviceId, DeviceState>
}
interface PowerState {
  history: PowerSample[]
  devices: Record<DeviceId, DeviceState>
  strips: Record<StationId, boolean>
  selected: Selection
  panelExpanded: boolean
  setPanelExpanded: (expanded: boolean) => void
  activeStation: StationId | null
  cutaway: boolean
  sessionSeconds: number
  lastTickMs: number | null
  sync: (monotonicMs?: number) => void
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
function powerSample(devices: Record<DeviceId, DeviceState>, time: number): PowerSample {
  const readings = {} as Record<DeviceId, number>
  const stations = Object.fromEntries(STATIONS.map((s) => [s.id, 0])) as Record<StationId, number>
  let total = 0
  for (const spec of DEVICE_CATALOG) {
    const watts = devices[spec.id].watts
    readings[spec.id] = watts
    stations[spec.stationId] += watts
    total += watts
  }
  return { time, devices: readings, stations, total }
}

/** 采样窗口：同一窗口内的连续控制只保留最后一个读数。
 * 拖动滑块一秒能触发几十次事件，逐次入队会把 90 点缓冲里的历史挤空。
 */
const SAMPLE_WINDOW_MS = 250
function recordPower(history: PowerSample[], devices: Record<DeviceId, DeviceState>, now: number) {
  // 控制事件与每秒采样都进队列；用单调时间戳，系统时钟回拨也不会乱序。
  const lastTime = history.at(-1)?.time ?? 0
  const time = Math.max(Number.isFinite(now) ? now : Date.now(), lastTime)
  const kept = time - lastTime < SAMPLE_WINDOW_MS ? history.slice(0, -1) : history
  return [...kept, powerSample(devices, time)].slice(-90)
}
/** 取自 3746e49 的演示用波动，不是采集值。各设备相位不同，系数保持在 94%～100%。
 */
function powerWave(elapsed: number, index: number) {
  return 0.97 + 0.03 * Math.sin(elapsed * 0.7 + index * 2)
}
function advancePower(state: PowerState, seconds: number): Partial<PowerState> {
  const dt = Math.max(Number.isFinite(seconds) ? seconds : 0, 0)
  if (dt === 0) return {}
  const devices = { ...state.devices }
  DEVICE_CATALOG.forEach((spec, index) => {
    const device = state.devices[spec.id]
    const powered = state.masterOn && state.strips[spec.stationId] && device.on
    const step = powered
      ? powerStep(device.watts, spec.referenceWatts * device.level, state.sessionSeconds, dt, index)
      : { watts: 0, energyWh: 0 }
    devices[spec.id] = { ...device, watts: step.watts, energyWh: device.energyWh + step.energyWh }
  })
  return { devices, sessionSeconds: state.sessionSeconds + dt }
}
function settle(state: PowerState, monotonicMs: number): Partial<PowerState> {
  if (!Number.isFinite(monotonicMs)) return {}
  const now = Math.max(monotonicMs, state.lastTickMs ?? monotonicMs)
  return {
    ...advancePower(state, state.lastTickMs === null ? 0 : (now - state.lastTickMs) / 1000),
    lastTickMs: now,
  }
}
/** 开关与滑块和读数在同一次事务里更新。 */
function withPower(
  state: PowerState,
  changes: Partial<PowerState>,
): Partial<PowerState> {
  // 先把旧设置结算到控制发生的那一刻，再应用改动。
  const settled = state.lastTickMs === null ? {} : settle(state, performance.now())
  state = { ...state, ...settled }
  const next = { ...state, ...changes }
  const devices = Object.fromEntries(
    DEVICE_CATALOG.map((spec, index) => {
      const device = next.devices[spec.id]
      const previous = state.devices[spec.id]
      const powered = next.masterOn && next.strips[spec.stationId] && device.on
      // 拖动时按比例缩放当前波值，不去重置其他设备。
      const watts = !powered ? 0 : previous.watts > 0
        ? previous.watts * (device.level / previous.level)
        : spec.referenceWatts * device.level * powerWave(state.sessionSeconds, index)
      return [
        spec.id,
        {
          ...device,
          watts,
          energyWh: previous.energyWh,
        },
      ]
    }),
  ) as Record<DeviceId, DeviceState>
  const changed = DEVICE_CATALOG.some((spec) => devices[spec.id].watts !== state.devices[spec.id].watts)
  return {
    ...settled,
    ...changes,
    devices,
    history: changed ? recordPower(state.history, devices, Date.now()) : state.history,
  }
}
const startingDevices = initialDevices()
export const usePowerStore = create<PowerState>()((set) => ({
  devices: startingDevices,
  history: [powerSample(startingDevices, Date.now())],
  strips: { s1: true, s2: true, s3: true, s4: true },
  selected: null,
  panelExpanded: false,
  setPanelExpanded: (panelExpanded) => set({ panelExpanded }),
  activeStation: null,
  cutaway: true,
  sessionSeconds: 0,
  lastTickMs: null,
  sync: (monotonicMs = performance.now()) => set((state) => {
    const next = { ...state, ...settle(state, monotonicMs) }
    return { ...next, history: recordPower(state.history, next.devices, Date.now()) }
  }),
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
      panelExpanded: false,
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
      panelExpanded: false,
      activeStation,
      cutaway: true,
      autoRotate: false,
      inspectionPart: 'station',
      inspectedDevice: null,
      cameraRevision: state.cameraRevision + 1,
    })),
  closePanel: () => set({ selected: null, panelExpanded: false }),
  toggle: (id) =>
    set((state) =>
      withPower(state, {
        devices: {
          ...state.devices,
          [id]: { ...state.devices[id], on: !state.devices[id].on },
        },
      }),
    ),
  setLevel: (id, level) =>
    set((state) =>
      withPower(state, {
        devices: {
          ...state.devices,
          [id]: {
            ...state.devices[id],
            level: Number.isFinite(level)
              ? Math.max(0.1, Math.min(1, level))
              : state.devices[id].level,
          },
        },
      }),
    ),
  setMaster: (masterOn) => set((state) => withPower(state, { masterOn })),
  setStrip: (id, on) =>
    set((state) => withPower(state, { strips: { ...state.strips, [id]: on } })),
  setMode: (mode) =>
    set((state) =>
      withPower(state, {
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
                    ? [
                        'lamp',
                        'speaker',
                        'fan',
                        'humidifier',
                        'phone',
                      ].includes(d.kind)
                    : d.defaultOn,
              level: mode === 'relax' && d.kind === 'lamp' ? 0.4 : 1,
            },
          ]),
        ) as Record<DeviceId, DeviceState>,
      }),
    ),
  setView: (cameraView) =>
    set((state) => ({
      cameraView,
      selected: null,
      panelExpanded: false,
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
      const next = { ...state, ...advancePower(state, seconds) }
      return {
        ...next,
        history: recordPower(state.history, next.devices, now),
      }
    }),
}))
