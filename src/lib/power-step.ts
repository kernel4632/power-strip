/** 功率按正弦波动追随、电量按梯形积分，两者都取自 3746e49。
 * 必须保留完整的时间间隔，不要恢复旧版「每次最多算 5 秒」的截断。
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
