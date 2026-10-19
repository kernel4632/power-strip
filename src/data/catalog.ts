import type {
  CameraView,
  DeviceId,
  DeviceSpec,
  Point3,
  SceneMode,
} from '../types'

// Illustrative parameters only; no hardware telemetry or safety certification.
export const CIRCUIT_LIMIT = 2200
export const VOLTAGE = 220
export const STRIP_POSITION: Point3 = [1.28, 1.22, -1.28]
export const DEVICE_CATALOG: DeviceSpec[] = [
  {
    id: 'monitor',
    name: '桌面显示器',
    english: 'STUDIO DISPLAY',
    category: '学习设备',
    description:
      '细腻的屏幕背光与实时功耗联动。调节负载，观察桌面工作站的能源变化。',
    ratedWatts: 38,
    standbyWatts: 0.5,
    color: '#76c9bf',
    position: [1.16, 1.18, -2.14],
    target: [1.16, 1.55, -2.14],
    camera: [3.6, 2.9, 1.4],
    labelOffset: [0, 0.94, 0],
  },
  {
    id: 'laptop',
    name: '笔记本电脑',
    english: 'PERSONAL WORKSTATION',
    category: '学习设备',
    description:
      '屏幕、键盘背光和工作负载共同构成你的学习工作站。关闭后保留少量待机功率。',
    ratedWatts: 65,
    standbyWatts: 2,
    color: '#9ca9e5',
    position: [2.18, 1.18, -1.71],
    target: [2.18, 1.35, -1.71],
    camera: [4.1, 2.7, 1.25],
    labelOffset: [0, 0.66, 0],
  },
  {
    id: 'lamp',
    name: '阅读台灯',
    english: 'TASK LIGHT',
    category: '照明设备',
    description: '暖色局部照明点亮书桌。亮度同时影响灯光强度和模拟用电负载。',
    ratedWatts: 9,
    standbyWatts: 0,
    color: '#f0c37a',
    position: [2.96, 1.18, -2.22],
    target: [2.96, 1.52, -2.22],
    camera: [5.1, 2.7, 0.3],
    labelOffset: [0, 0.92, 0],
  },
  {
    id: 'fan',
    name: '桌面循环扇',
    english: 'AIR CIRCULATOR',
    category: '生活电器',
    description:
      '真实转动的扇叶随负载平滑加速与减速。低速陪伴学习，高速带来一阵清风。',
    ratedWatts: 35,
    standbyWatts: 0,
    color: '#8cc9df',
    position: [-0.04, 1.18, -2.1],
    target: [-0.04, 1.52, -2.1],
    camera: [1.9, 2.65, 1.15],
    labelOffset: [0, 0.86, 0],
  },
  {
    id: 'phone',
    name: '无线充电座',
    english: 'WIRELESS CHARGER',
    category: '学习设备',
    description: '手机静置在无线充电座上。充电状态指示灯与流动能量同步变化。',
    ratedWatts: 20,
    standbyWatts: 0.5,
    color: '#ccaddd',
    position: [0.28, 1.18, -1.49],
    target: [0.28, 1.26, -1.49],
    camera: [1.9, 2.5, 0.9],
    labelOffset: [0, 0.38, 0],
  },
  {
    id: 'kettle',
    name: '恒温电热水壶',
    english: 'ELECTRIC KETTLE',
    category: '生活电器',
    description:
      '开启加热，观察蒸汽与高负载能流。大功率电器会显著改变总负载。此为可视化演示，不代表宿舍允许使用。',
    ratedWatts: 1500,
    standbyWatts: 0,
    color: '#de9c73',
    position: [3.17, 1.34, 0.32],
    target: [3.17, 1.67, 0.32],
    camera: [5.9, 2.8, 3.9],
    labelOffset: [0, 0.87, 0],
  },
  {
    id: 'fridge',
    name: '迷你冰箱',
    english: 'COMPACT REFRIGERATOR',
    category: '生活电器',
    description:
      '压缩机周期运行的示意模型。功率曲线会随模拟压缩机周期缓慢起伏。',
    ratedWatts: 90,
    standbyWatts: 0,
    color: '#92b99c',
    position: [3.17, 0.08, 0.32],
    target: [3.17, 0.72, 0.32],
    camera: [6.2, 2.4, 4.5],
    labelOffset: [0.55, 0.65, 0],
  },
  {
    id: 'ac',
    name: '变频空调',
    english: 'CLIMATE CONTROL',
    category: '环境设备',
    description:
      '叶片与气流呈现空调工作状态。变频负载以平滑变化模拟，未接入真实温度或电表。',
    ratedWatts: 800,
    standbyWatts: 1,
    color: '#7dbaca',
    position: [1.5, 3.12, -3.01],
    target: [1.5, 3.13, -2.8],
    camera: [4.8, 3.8, 1.6],
    labelOffset: [0.95, 0.1, 0.15],
  },
]

export const DEVICE_MAP = Object.fromEntries(
  DEVICE_CATALOG.map((device) => [device.id, device]),
) as Record<DeviceId, DeviceSpec>
export const SCENE_MODES: { id: SceneMode; label: string; subtitle: string }[] =
  [
    { id: 'study', label: '专注学习', subtitle: 'WORK & CREATE' },
    { id: 'relax', label: '晚间放松', subtitle: 'SLOW DOWN' },
    { id: 'away', label: '离开宿舍', subtitle: 'ENERGY SAVING' },
  ]
export const CAMERA_VIEWS: Record<
  CameraView,
  { position: Point3; target: Point3; label: string }
> = {
  overview: {
    position: [10.8, 9.2, 12.6],
    target: [0, 1.15, -0.3],
    label: '宿舍全景',
  },
  desk: {
    position: [6.2, 4.3, 4.4],
    target: [1.45, 1.3, -1.8],
    label: '学习空间',
  },
  living: {
    position: [4.4, 4.4, 7.5],
    target: [-1.4, 1.25, -0.5],
    label: '生活空间',
  },
  top: { position: [0.2, 13.5, 3.4], target: [0, 0.3, 0], label: '俯瞰视角' },
}
