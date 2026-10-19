import type { ApplianceSpec } from '../types'

export const APPLIANCE_CATALOG: ApplianceSpec[] = [
  {
    kind: 'laptop',
    label: '笔记本电脑',
    ratedWatts: 65,
    standbyWatts: 2,
    color: '#4f8cff',
  },
  {
    kind: 'monitor',
    label: '显示器',
    ratedWatts: 32,
    standbyWatts: 1,
    color: '#7a5cff',
  },
  {
    kind: 'kettle',
    label: '电热水壶',
    ratedWatts: 1500,
    standbyWatts: 0,
    color: '#ff6b4a',
  },
  {
    kind: 'lamp',
    label: '台灯',
    ratedWatts: 9,
    standbyWatts: 0,
    color: '#ffd54a',
  },
  {
    kind: 'fridge',
    label: '迷你冰箱',
    ratedWatts: 90,
    standbyWatts: 3,
    color: '#3ecf8e',
  },
  {
    kind: 'phone',
    label: '手机充电器',
    ratedWatts: 20,
    standbyWatts: 0.5,
    color: '#2ec4d6',
  },
]

export function findSpec(kind: ApplianceSpec['kind']): ApplianceSpec {
  const spec = APPLIANCE_CATALOG.find((item) => item.kind === kind)
  if (!spec) throw new Error(`unknown appliance kind: ${kind}`)
  return spec
}
