import { MEASURED_INTERVALS, MEASURED_TIMES } from '../data/measured'

/**
 * 把真实时刻换算成实测表里的十分钟区间序号。
 * 23:50 之后到次日 00:00 之前仍落在最后一个区间。
 */
export function measuredIndex(at: Date): number {
  // The source is a Chinese dorm day. Keep the same interval in every browser timezone.
  const china = new Date(at.getTime() + 8 * 60 * 60 * 1000)
  const minutes = china.getUTCHours() * 60 + china.getUTCMinutes()
  return Math.min(MEASURED_INTERVALS - 1, Math.floor(minutes / 10))
}

/** 区间起点，例如 "10:30"。 */
export function measuredLabel(index: number): string {
  return MEASURED_TIMES[index] ?? ''
}
