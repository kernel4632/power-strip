/** Integrate the existing sine target and first-order smoothing over real time.
 * The closed form avoids discarded time or a catch-up loop after a suspended tab.
 */
export function powerStep(watts: number, ceiling: number, elapsed: number, seconds: number, index: number) {
  const rate = 2.5
  const frequency = 0.7
  const phase = elapsed * frequency + index * 2
  const endPhase = phase + seconds * frequency
  const base = ceiling * 0.97
  const amplitude = ceiling * 0.03
  const sine = amplitude * rate * rate / (rate * rate + frequency * frequency)
  const cosine = -amplitude * rate * frequency / (rate * rate + frequency * frequency)
  const residual = watts - base - sine * Math.sin(phase) - cosine * Math.cos(phase)
  const decay = Math.exp(-rate * seconds)
  return {
    watts: base + sine * Math.sin(endPhase) + cosine * Math.cos(endPhase) + residual * decay,
    energyWh: (base * seconds
      + sine * (Math.cos(phase) - Math.cos(endPhase)) / frequency
      + cosine * (Math.sin(endPhase) - Math.sin(phase)) / frequency
      + residual * -Math.expm1(-rate * seconds) / rate) / 3600,
  }
}
