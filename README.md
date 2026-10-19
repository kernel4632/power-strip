# power-strip · 宿舍排插功率可视化

3D 化的宿舍电器交互与排插功率可视化系统。以可视化为主线，用可交互的三维场景呈现排插、插在排插上的各类宿舍电器，以及实时功率负载。

## 特性

- **3D 排插场景**：基于 React Three Fiber 的程序化排插模型，5 个可交互插座。
- **电器交互**：点击电器或面板开关即可上电/断电，电器的悬停、浮动、发光状态实时联动。
- **功率可视化**：右侧 HUD 实时汇总总功率、回路占用比例，并按插座拆分显示各电器的瞬时功耗。
- **过载提示**：总功率接近/超过回路上限（2200 W）时高亮告警。
- **数据驱动**：电器目录与功率参数集中在 `src/data/catalog.ts`，状态由 `zustand` 统一管理。

## 技术栈

| 层 | 选型 |
| --- | --- |
| 构建 | Vite |
| 框架 | React 19 + TypeScript |
| 3D | three.js + @react-three/fiber + @react-three/drei |
| 状态 | zustand |
| 检查 | oxlint + tsc |

## 快速开始

```bash
npm install
npm run dev        # 本地开发
npm run build      # 类型检查 + 生产构建
npm run lint       # 代码检查
npm run typecheck  # 仅类型检查
```

## 目录结构

```
src/
├─ App.tsx              # 布局：3D 场景 + 侧边面板
├─ types.ts             # 领域类型（电器、插座）
├─ data/catalog.ts      # 电器目录与功率参数
├─ store/usePowerStore.ts  # 插座/电器状态与功率计算
├─ scene/
│  ├─ Scene.tsx         # Canvas、灯光、桌面、相机控制
│  ├─ PowerStrip.tsx    # 3D 排插与插座
│  ├─ Appliance.tsx     # 3D 电器模型与交互
│  └─ layout.ts         # 场景布局常量
└─ ui/PowerPanel.tsx    # 功率 HUD 面板
```

## 后续规划

- 接入真实的功率采样/模拟数据流，替换静态额定功率。
- 增加电流/电压曲线图表与历史回放。
- 丰富电器模型与电路拓扑可视化。

## 许可

MIT
