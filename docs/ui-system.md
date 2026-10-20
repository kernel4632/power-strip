# UI 组件与主题规范

所有二维 UI 必须使用 shadcn/ui 官方组件。业务文件只负责数据、交互和 Tailwind 布局组合，禁止自行实现 Button、Switch、Slider、Tooltip、图表或抽屉等控件，禁止恢复旧的控件 CSS。新增组件通过官方 CLI 选择。

## 来源

使用 `shadcn@4.22.1` 官方 CLI，配置为 `new-york`、Radix、neutral、CSS variables、Lucide，配置保存在 `components.json`。官方组件位于 `src/components/ui/`；`src/ui/` 是用这些组件组合的业务界面。

- 安装：https://ui.shadcn.com/docs/installation/vite
- 主题：https://ui.shadcn.com/docs/theming
- 图表：https://ui.shadcn.com/docs/components/radix/chart
- 源码及 MIT 许可：https://github.com/shadcn-ui/ui

| 区域 | 官方组件 |
| --- | --- |
| 顶栏、场景工具 | Button、Toggle、Tooltip |
| 全寝功率、设备标记 | Card、Badge、Button、Collapsible |
| 镜头菜单、指南 | Popover、Button、Separator、Kbd |
| 桌面侧栏、手机底部详情 | Sheet、ScrollArea、Card |
| 电源、负载、功率占比 | Switch、Label、Slider、Progress |
| 功率曲线、悬浮读数 | Sparkline（`src/components/ui/sparkline.tsx`，项目内唯一的自绘控件） |
| 加载、错误与状态说明 | Skeleton、Alert |

界面以场景为主，不显示宣传卡片、顶部生活模式、底部床位导航或床位名称牌。点击家具、能源面板中的床位列表或数字快捷键进入床位。只保留必要的数据名称、单位与操作标签，操作帮助按需打开；不在常驻界面重复显示模拟说明。手机详情面板贴底显示，不为已删除的导航留空。

## 全局变量

`src/index.css` 只包含 Tailwind 导入、主题映射、`:root` / `.dark` 变量及基础 reset；不添加组件选择器。默认使用 shadcn neutral 主题。

- 配色：`background`、`foreground`、`card`、`muted`、`primary`、`border`、`ring`、`chart-*` 等语义变量。
- 间距与布局尺寸：标准 `p-4`、`gap-2`、`w-96` 等工具类，统一从 Tailwind `--spacing` 派生。不得使用 `p-[13px]` 或局部 style 定义间距。
- 圆角：全局 `--radius` 及其派生变量。
- 焦点、指标边框：全局 `--focus-ring-width` / `--indicator-border-width`，从 `--spacing` 派生。
- 明暗主题在 HTML 根元素切换 `.dark`，包括所有 Portal 内容。
- 移动断点读取全局 `--breakpoint-md`，与 Tailwind `md:` 保持一致。

官方源码仅做了必要的主题及可访问性接入：固定 white/black 替换为语义颜色，少量 px/rem 尺寸替换为标准工具类或全局变量，Slider 将可访问名称传到 Thumb，Progress 向 Root 传递数值，移动 hook 读取全局断点。没有添加自制控件皮肤。更新官方组件后需重新核对这些适配。MIT 许可保存在 `docs/third-party/shadcn-ui-LICENSE.md`。

图表是唯一例外：官方 Chart 组件依赖 Recharts，单个 60 点曲线的分包为 324 kB（gzip 97 kB），只为了画一条折线。`src/components/ui/sparkline.tsx` 用归一化 viewBox、非缩放描边和自适应纵轴实现同一件事，约 150 行、无运行时依赖。它不是业务文件里的手写 SVG，而是和官方组件同级的受控原语：样式只用 Tailwind 语义类，纵轴随数据留白，悬浮读数走 Popover 同款语义色。若后续需要堆叠柱、饼图或多序列对比，应重新评估是否引入图表库，而不是在 Sparkline 上继续加功能。

3D 场景几何、材质和设备自身的屏幕贴图不属于二维 UI。场景背景色不写死在组件里，改由 `index.css` 的 `--scene-day` / `--scene-night` 提供，`Scene.tsx` 读取后转成 three 的 `Color`，`App.tsx` 用同一对变量同步 `theme-color`，避免浏览器状态栏和实际背景不一致。场景标签只保留来自相机投影的动态坐标，标签本身使用 shadcn Button / Badge，不读取模型材质色作为 UI 配色。

## 验证

运行 `npm run check:ui`、`npm run lint -- --deny-warnings` 和 `npm run build:pages`。UI 检查阻止常见的手写原生控件、内联视觉样式、组件 CSS、固定间距与非语义色回流；它不能替代组件来源核对及浏览器视觉检查。

官方导出 variants 和移动 hook 的实现保留，仅对对应文件放宽 Fast Refresh 导出及 effect 初始化提示；业务代码继续使用原有 lint 规则。
