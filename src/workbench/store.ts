import { create } from 'zustand'
import {
  BENCH_CATALOG,
  BENCH_MAP,
  BENCH_MAX_ITEMS,
  DEFAULT_BENCH_SETTINGS,
} from './catalog'
import {
  findPlacement,
  fitsPlacement,
  fitsTable,
  fitsSocketPlacement,
  SOCKET_POSITIONS,
  socketDevicePosition,
} from './layout'
import { computeRisk } from './risk'
import type {
  BenchDestination,
  BenchItem,
  BenchKind,
  BenchLimits,
  BenchPoint,
  BenchPreset,
  BenchReadings,
  BenchSettings,
} from './types'

type LimitScope = 'strip' | 'room'

export interface BenchState {
  items: BenchItem[]
  masterOn: boolean
  settings: BenchSettings
  selectionId: string | null
  /** Legacy-friendly selection alias used by scene and sidebar consumers. */
  selectedId: string | null
  addItem: (kind: BenchKind, destination?: BenchPoint | BenchDestination) => string | null
  moveItem: (id: string, destination: BenchDestination) => boolean
  disconnectItem: (id: string, position?: BenchPoint) => boolean
  removeItem: (id: string) => void
  setItemOn: (id: string, on: boolean) => void
  setItemLoad: (id: string, load: number) => void
  setItemCustomWatts: (id: string, watts: number | null) => void
  setMasterOn: (on: boolean) => void
  setMaster: (on: boolean) => void
  setLimits: (scope: LimitScope, limits: BenchLimits) => boolean
  updateLimits: (scope: LimitScope, limits: Partial<BenchLimits>) => boolean
  setThresholds: (scope: LimitScope, warningWatts: number, limitWatts: number) => boolean
  setBackgroundWatts: (watts: number) => boolean
  select: (id: string | null) => void
  selectItem: (id: string | null) => void
  setOn: (id: string, on: boolean) => void
  setLoad: (id: string, load: number) => void
  setCustomWatts: (id: string, watts: number | null) => void
  reset: () => void
  applyPreset: (preset: BenchPreset) => void
}

function cloneDefaultSettings(): BenchSettings {
  return {
    strip: { ...DEFAULT_BENCH_SETTINGS.strip },
    room: { ...DEFAULT_BENCH_SETTINGS.room },
    backgroundWatts: DEFAULT_BENCH_SETTINGS.backgroundWatts,
  }
}

function defaultItems(): BenchItem[] {
  return [
    { id: 'item-kettle', kind: 'kettle', position: [-2.05, 0.32], socket: 0, on: true, load: 100, customWatts: null },
    { id: 'item-gaming-laptop', kind: 'gaming', position: [-0.62, 0.24], socket: 1, on: true, load: 100, customWatts: null },
    { id: 'item-lamp', kind: 'lamp', position: [0.78, 0.32], socket: 2, on: true, load: 100, customWatts: null },
    { id: 'item-phone', kind: 'phone', position: [-2.6, 1.3], socket: null, on: false, load: 100, customWatts: null },
    { id: 'item-cooker', kind: 'cooker', position: [2.55, 1.35], socket: null, on: false, load: 100, customWatts: null },
  ]
}

function inBoundsLimits(limits: BenchLimits) {
  return Number.isFinite(limits.warningWatts)
    && Number.isFinite(limits.limitWatts)
    && limits.warningWatts > 0
    && limits.warningWatts < limits.limitWatts
    && limits.limitWatts <= 10000
}

function isPoint(position: BenchPoint) {
  return Array.isArray(position)
    && position.length === 2
    && Number.isFinite(position[0])
    && Number.isFinite(position[1])
}

function itemWatts(item: BenchItem, masterOn: boolean) {
  if (!masterOn || item.socket === null || !item.on) return 0
  const referenceWatts = item.customWatts ?? BENCH_MAP[item.kind].referenceWatts
  return referenceWatts * item.load / 100
}

/** A Zustand selector that calculates instantaneous readings from current state. */
export function selectReadings(state: Pick<BenchState, 'items' | 'masterOn' | 'settings'>): BenchReadings {
  const itemWattsById: Record<string, number> = {}
  let connectedCount = 0
  let runningCount = 0
  let connectedWatts = 0

  for (const item of state.items) {
    if (item.socket !== null) connectedCount += 1
    const watts = itemWatts(item, state.masterOn)
    itemWattsById[item.id] = watts
    if (watts > 0) runningCount += 1
    connectedWatts += watts
  }

  const roomWatts = state.settings.backgroundWatts + connectedWatts
  return {
    strip: computeRisk(connectedWatts, state.settings.strip),
    room: computeRisk(roomWatts, state.settings.room),
    itemWatts: itemWattsById,
    connectedCount,
    runningCount,
  }
}

type ScenarioMode = 'warning' | 'overload'

function applianceCombos(maxItems = SOCKET_POSITIONS.length) {
  const specs = [...BENCH_CATALOG].sort((a, b) => b.referenceWatts - a.referenceWatts)
  const combos: typeof specs[] = []

  function visit(start: number, chosen: typeof specs) {
    if (chosen.length) combos.push(chosen)
    if (chosen.length === maxItems) return
    for (let index = start; index < specs.length; index += 1) {
      visit(index + 1, [...chosen, specs[index]])
    }
  }

  visit(0, [])
  return combos
}

function chooseScenario(scope: LimitScope, settings: BenchSettings, mode: ScenarioMode) {
  const thresholds = settings[scope]
  const totalFor = (combo: typeof BENCH_CATALOG) =>
    (scope === 'room' ? settings.backgroundWatts : 0)
      + combo.reduce((sum, spec) => sum + spec.referenceWatts, 0)
  const combos = applianceCombos()

  if (mode === 'warning') {
    const matching = combos
      .filter(combo => totalFor(combo) >= thresholds.warningWatts && totalFor(combo) < thresholds.limitWatts)
      .sort((a, b) => totalFor(b) - totalFor(a))
    if (matching[0]) return { kinds: matching[0].map(spec => spec.id), customWatts: null as number | null }

    // When no catalog combination can land in the warning band, retain the
    // strongest feasible under-limit combination (or the smallest otherwise).
    const underLimit = combos
      .filter(combo => totalFor(combo) < thresholds.limitWatts)
      .sort((a, b) => totalFor(b) - totalFor(a))
    const fallback = underLimit[0] ?? [...combos].sort((a, b) => totalFor(a) - totalFor(b))[0]
    return { kinds: fallback.map(spec => spec.id), customWatts: null as number | null }
  }

  const overload = combos
    .filter(combo => totalFor(combo) > thresholds.limitWatts)
    .sort((a, b) => totalFor(a) - totalFor(b))[0]
  if (overload) return { kinds: overload.map(spec => spec.id), customWatts: null as number | null }

  // At unusually high user-defined limits, use the catalog's largest devices
  // and raise one explicit custom rating just enough to make this preset an
  // overload while leaving the selected limits unchanged.
  const kinds = [...BENCH_CATALOG]
    .sort((a, b) => b.referenceWatts - a.referenceWatts)
    .slice(0, SOCKET_POSITIONS.length)
    .map(spec => spec.id)
  const othersWatts = kinds.slice(1).reduce((sum, kind) => sum + BENCH_MAP[kind].referenceWatts, 0)
  const customWatts = Math.max(
    BENCH_MAP[kinds[0]].referenceWatts,
    thresholds.limitWatts - (scope === 'room' ? settings.backgroundWatts : 0) - othersWatts + 1,
  )
  return { kinds, customWatts }
}

function scenarioItems(kinds: BenchKind[], customWatts: number | null = null): BenchItem[] {
  const items: BenchItem[] = []
  for (const [socket, kind] of kinds.entries()) {
    const position = findPlacement(kind, items, socketDevicePosition(socket))
    if (!position) continue
    items.push({
      id: `preset-${kind}`,
      kind,
      position,
      socket,
      on: true,
      load: 100,
      customWatts: socket === 0 ? customWatts : null,
    })
  }

  const availableFreeKinds: BenchKind[] = ['phone', 'cooker', 'lamp', 'macbook', 'tablet', 'gaming', 'dryer', 'kettle']
  const desiredPositions: BenchPoint[] = [[-2.6, 1.3], [2.55, 1.35]]
  for (const kind of availableFreeKinds) {
    if (items.length >= Math.min(BENCH_MAX_ITEMS, kinds.length + desiredPositions.length)) break
    if (kinds.includes(kind)) continue
    const desired = desiredPositions[items.length - kinds.length]
    if (!desired) break
    const position = findPlacement(kind, items, desired)
    if (!position) continue
    items.push({
      id: `preset-${kind}`,
      kind,
      position,
      socket: null,
      on: false,
      load: 100,
      customWatts: null,
    })
  }
  return items
}

let itemSequence = 0

export const useBenchStore = create<BenchState>()((set) => ({
  items: defaultItems(),
  masterOn: true,
  settings: cloneDefaultSettings(),
  selectionId: null,
  selectedId: null,

  addItem: (kind, destination = [0, 1]) => {
    let addedId: string | null = null
    set(state => {
      if (state.items.length >= BENCH_MAX_ITEMS) return state
      let position: BenchPoint
      let socket: number | null = null
      if (Array.isArray(destination)) {
        if (!isPoint(destination as BenchPoint)) return state
        const placement = findPlacement(kind, state.items, destination as BenchPoint)
        if (!placement) return state
        position = placement
      } else if ('socket' in destination) {
        socket = destination.socket
        if (!Number.isInteger(socket) || socket < 0 || socket >= SOCKET_POSITIONS.length) return state
        if (state.items.some(item => item.socket === socket) || !fitsSocketPlacement(kind, socket, state.items, '')) return state
        const placement = findPlacement(kind, state.items, socketDevicePosition(socket))
        if (!placement) return state
        position = placement
      } else {
        if (!isPoint(destination.position)) return state
        if (!fitsPlacement(kind, destination.position, state.items)) return state
        position = [...destination.position]
      }
      addedId = `bench-item-${++itemSequence}`
      const item: BenchItem = { id: addedId, kind, position, socket, on: false, load: 100, customWatts: null }
      return { items: [...state.items, item], selectionId: addedId, selectedId: addedId }
    })
    return addedId
  },

  moveItem: (id, destination) => {
    let moved = false
    set(state => {
      const item = state.items.find(candidate => candidate.id === id)
      if (!item) return state

      if ('socket' in destination) {
        const { socket } = destination
        if (!Number.isInteger(socket) || socket < 0 || socket >= SOCKET_POSITIONS.length) return state
        if (item.socket === socket) {
          moved = true
          return state
        }
        if (state.items.some(candidate => candidate.id !== id && candidate.socket === socket)) return state
        if (!fitsSocketPlacement(item.kind, socket, state.items, id)) return state
        const position = fitsTable(item.kind, item.position)
          ? item.position
          : findPlacement(item.kind, state.items, socketDevicePosition(socket), id)
        if (!position) return state
        moved = true
        return {
          items: state.items.map(candidate => candidate.id === id
            ? { ...candidate, socket, position }
            : candidate),
        }
      }

      if (!isPoint(destination.position)) return state
      if (!fitsPlacement(item.kind, destination.position, state.items, id)) return state
      const position: BenchPoint = [...destination.position]
      moved = true
      return {
        items: state.items.map(candidate => candidate.id === id
          ? { ...candidate, position }
          : candidate),
      }
    })
    return moved
  },

  disconnectItem: (id, position) => {
    let disconnected = false
    set(state => {
      if (position && !isPoint(position)) return state
      if (!state.items.some(item => item.id === id)) return state
      disconnected = true
      return { items: state.items.map(item => item.id === id
        ? { ...item, socket: null, plugPosition: position ? [...position] : undefined }
        : item) }
    })
    return disconnected
  },

  removeItem: id => set(state => {
    if (!state.items.some(item => item.id === id)) return state
    return {
      items: state.items.filter(item => item.id !== id),
      selectionId: state.selectionId === id ? null : state.selectionId,
      selectedId: state.selectedId === id ? null : state.selectedId,
    }
  }),

  setItemOn: (id, on) => set(state => {
    if (!state.items.some(item => item.id === id)) return state
    return { items: state.items.map(item => item.id === id ? { ...item, on } : item) }
  }),

  setItemLoad: (id, load) => set(state => {
    if (!Number.isFinite(load) || !state.items.some(item => item.id === id)) return state
    const clampedLoad = Math.max(0, Math.min(100, load))
    return { items: state.items.map(item => item.id === id ? { ...item, load: clampedLoad } : item) }
  }),

  setItemCustomWatts: (id, watts) => set(state => {
    if ((watts !== null && (!Number.isFinite(watts) || watts < 0)) || !state.items.some(item => item.id === id)) return state
      return { items: state.items.map(item => item.id === id ? { ...item, customWatts: watts === null ? null : Math.min(10000, watts) } : item) }
  }),

  setMasterOn: masterOn => set({ masterOn }),
  setMaster: masterOn => set({ masterOn }),

  setLimits: (scope, limits) => {
    if (!inBoundsLimits(limits)) return false
    set(state => ({ settings: { ...state.settings, [scope]: { ...limits } } }))
    return true
  },

  updateLimits: (scope, limits) => {
    let valid = false
    set(state => {
      const nextLimits = { ...state.settings[scope], ...limits }
      if (!inBoundsLimits(nextLimits)) return state
      valid = true
      return { settings: { ...state.settings, [scope]: nextLimits } }
    })
    return valid
  },

  setThresholds: (scope, warningWatts, limitWatts) => {
    const limits = { warningWatts, limitWatts }
    if (!inBoundsLimits(limits)) return false
    set(state => ({ settings: { ...state.settings, [scope]: limits } }))
    return true
  },

  setBackgroundWatts: watts => {
    if (!Number.isFinite(watts)) return false
    const backgroundWatts = Math.max(0, Math.min(5000, watts))
    set(state => ({ settings: { ...state.settings, backgroundWatts } }))
    return true
  },

  select: selectionId => set(state => {
    const selected = selectionId !== null && state.items.some(item => item.id === selectionId) ? selectionId : null
    return { selectionId: selected, selectedId: selected }
  }),

  selectItem: selectionId => set(state => {
    const selected = selectionId !== null && state.items.some(item => item.id === selectionId) ? selectionId : null
    return { selectionId: selected, selectedId: selected }
  }),

  setOn: (id, on) => set(state => {
    if (!state.items.some(item => item.id === id)) return state
    return { items: state.items.map(item => item.id === id ? { ...item, on } : item) }
  }),

  setLoad: (id, load) => set(state => {
    if (!Number.isFinite(load) || !state.items.some(item => item.id === id)) return state
    const clampedLoad = Math.max(0, Math.min(100, load))
    return { items: state.items.map(item => item.id === id ? { ...item, load: clampedLoad } : item) }
  }),

  setCustomWatts: (id, watts) => set(state => {
    if ((watts !== null && (!Number.isFinite(watts) || watts < 0)) || !state.items.some(item => item.id === id)) return state
    return { items: state.items.map(item => item.id === id ? { ...item, customWatts: watts === null ? null : Math.min(10000, watts) } : item) }
  }),

  reset: () => set({ items: defaultItems(), masterOn: true, settings: cloneDefaultSettings(), selectionId: null, selectedId: null }),

  applyPreset: preset => set(state => {
    if (preset === 'study') {
      return { items: defaultItems(), masterOn: true, selectionId: null, selectedId: null }
    }
    const scope: LimitScope = preset === 'room-warning' ? 'room' : 'strip'
    const mode: ScenarioMode = preset === 'overload' ? 'overload' : 'warning'
    const scenario = chooseScenario(scope, state.settings, mode)
    return {
      items: scenarioItems(scenario.kinds, scenario.customWatts),
      masterOn: true,
      selectionId: null,
      selectedId: null,
    }
  }),
}))

/** A descriptive alias for non-component consumers that prefer the longer name. */
export const useWorkbenchStore = useBenchStore

/** Convenience getter for consumers that hold a complete Zustand state value. */
export const readings = selectReadings
