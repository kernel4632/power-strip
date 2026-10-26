import type { BenchLimits, RiskReading } from './types'

/** Build an instantaneous risk reading from a power total and its thresholds. */
export function computeRisk(watts: number, limits: BenchLimits): RiskReading {
  const ratio = limits.limitWatts > 0 ? watts / limits.limitWatts : 0

  return {
    ...limits,
    watts,
    ratio: Number.isNaN(ratio) ? 0 : Math.max(0, Math.min(1, ratio)),
    status:
      watts >= limits.limitWatts
        ? 'overload'
        : watts >= limits.warningWatts
          ? 'warning'
          : 'normal',
    remainingWatts: limits.limitWatts - watts,
  }
}
