import { MEASURED_INTERVALS, MEASURED_TIMES } from '../data/measured'

/**
 * 把真实时刻换算成实测表里的十分钟区间序号。
 * 23:50 之后到次日 00:00 之前仍落在最后一个区间。
 */
export function measuredIndex(at: Date): number {
  const minutes = at.getHours() * 60 + at.getMinutes()
  return Math.min(MEASURED_INTERVALS - 1, Math.floor(minutes / 10))
}

/** 区间起点，例如 "10:30"。 */
export function measuredLabel(index: number): string {
  return MEASURED_TIMES[index] ?? ''
}
