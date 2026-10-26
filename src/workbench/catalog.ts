import { DEVICE_REFERENCE_MAP } from '../data/references'
import type { BenchKind, BenchSpec } from './types'

const SOURCE_IDS: Record<BenchKind, string> = { kettle: 'kettle', dryer: 'dryer', cooker: 'cooker', gaming: 'gaming', macbook: 'macbook', lamp: 'lamp', phone: 'android', tablet: 'tablet' }
const MODELS: Record<BenchKind, Pick<BenchSpec, 'footprint' | 'height' | 'color'>> = {
  kettle: { footprint: [0.66, 0.65], height: 0.76, color: '#c49c77' },
  dryer: { footprint: [0.75, 0.54], height: 0.42, color: '#b07969' },
  cooker: { footprint: [0.82, 0.75], height: 0.52, color: '#acb69f' },
  gaming: { footprint: [0.8, 0.61], height: 0.5, color: '#8e9da6' },
  macbook: { footprint: [0.8, 0.61], height: 0.5, color: '#bbc0b7' },
  lamp: { footprint: [0.69, 0.59], height: 0.74, color: '#d6c5a0' },
  phone: { footprint: [0.33, 0.4], height: 0.08, color: '#b2c3bb' },
  tablet: { footprint: [0.8, 0.62], height: 0.48, color: '#9caaa6' },
}
export const BENCH_CATALOG: BenchSpec[] = (Object.keys(SOURCE_IDS) as BenchKind[]).map(id => {
  const reference = DEVICE_REFERENCE_MAP[SOURCE_IDS[id]]
  return { id, name: reference.name, referenceWatts: Number.parseFloat(reference.referencePower), referenceText: reference.referencePower, referenceModel: reference.model, category: reference.category, ...MODELS[id] }
})
export const BENCH_MAP = Object.fromEntries(BENCH_CATALOG.map(item => [item.id, item])) as Record<BenchKind, BenchSpec>
export const BENCH_MAX_ITEMS = 8
export const DEFAULT_BENCH_SETTINGS = {
  strip: { warningWatts: 2000, limitWatts: 2500 },
  room: { warningWatts: 2400, limitWatts: 3000 },
  backgroundWatts: 600,
}
