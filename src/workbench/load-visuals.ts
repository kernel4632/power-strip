import type { RiskReading, RiskStatus } from './types'

export interface LoadVisual {
  active: boolean
  status: RiskStatus
  color: string
  pressure: number
  fill: number
  segments: number
  glow: number
  haloOpacity: number
  flowSpeed: number
  particleCount: number
  pulseHz: number
}

const COLORS: Record<RiskStatus, string> = { normal: '#54b99a', warning: '#f1af35', overload: '#ef5146' }

/** Visual encoding of configured power thresholds, NOT a temperature/trip model. */
export function loadVisuals(reading: RiskReading, enabled = true, reducedMotion = false): LoadVisual {
  const active = enabled && Number.isFinite(reading.watts) && reading.watts > 0
  if (!active) return { active: false, status: 'normal', color: '#7b8983', pressure: 0, fill: 0, segments: 0, glow: 0, haloOpacity: 0, flowSpeed: 0, particleCount: 0, pulseHz: 0 }
  const pressure = Math.max(0, Math.min(2, reading.watts / Math.max(1, reading.limitWatts)))
  const fill = Math.min(1, pressure)
  const status = reading.status
  return {
    active,
    status,
    color: COLORS[status],
    pressure,
    fill,
    segments: Math.max(1, Math.ceil(fill * 12)),
    glow: status === 'overload' ? 2.4 + (pressure - 1) * .5 : status === 'warning' ? 1.6 : .25 + fill * .75,
    haloOpacity: status === 'overload' ? .5 : status === 'warning' ? .28 : .06 + fill * .08,
    flowSpeed: reducedMotion ? 0 : .09 + fill * .18 + (status === 'overload' ? .28 + (pressure - 1) * .1 : status === 'warning' ? .12 : 0),
    particleCount: status === 'overload' ? 9 : 2 + Math.ceil(fill * 5),
    pulseHz: reducedMotion || status === 'normal' ? 0 : status === 'warning' ? .55 : .9,
  }
}

export function loadPulse(visual: LoadVisual, seconds: number) {
  if (!visual.pulseHz) return 1
  const amplitude = visual.status === 'overload' ? .5 : .28
  return 1 - amplitude + amplitude * (.5 + .5 * Math.sin(seconds * Math.PI * 2 * visual.pulseHz))
}

export function deviceVisualWeight(watts: number, limitWatts: number) {
  if (!Number.isFinite(watts) || watts <= 0) return 0
  return Math.sqrt(Math.min(1, watts / Math.max(1, limitWatts)))
}
