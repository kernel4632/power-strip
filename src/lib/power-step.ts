/** Power and trapezoidal energy update restored from 3746e49.
 * Keep the complete elapsed interval; do not restore the old five-second cap.
 */
export function powerStep(watts: number, ceiling: number, elapsed: number, seconds: number, index: number) {
  const wave = 0.97 + 0.03 * Math.sin((elapsed + seconds) * 0.7 + index * 2)
  const target = ceiling * wave
  const nextWatts = watts + (target - watts) * (1 - Math.exp(-seconds * 2.5))
  return {
    watts: nextWatts,
    energyWh: (((watts + nextWatts) / 2) * seconds) / 3600,
  }
}
