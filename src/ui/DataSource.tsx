import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { DEVICE_REFERENCE_MAP, DEVICE_SOURCE, POWER_SOURCE, type WorkbookSource } from '../data/references'
import type { DeviceSpec } from '../types'
import { SCENE_MEASURED_GROUPS, SCENE_MEASURED_TOTAL } from '../data/sceneMeasured'

export function DataSource({ groupId, device }: {
  groupId?: string
  device?: DeviceSpec
}) {
  const reference = groupId ? DEVICE_REFERENCE_MAP[groupId] : undefined
  return <Collapsible>
    <CollapsibleTrigger asChild>
      <Button variant="ghost" className="min-h-11 w-full justify-start px-0 text-xs text-muted-foreground">
        数据来源
      </Button>
    </CollapsibleTrigger>
    <CollapsibleContent className="space-y-3 pt-2 text-xs leading-relaxed text-muted-foreground">
      <Source source={POWER_SOURCE} />
        <p>小组收集整理，包含依据资料估读的数值。每 10 分钟一个区间，共 144 个；日耗电按区间功率求和 ÷ 6000 计算，24:00 不重复计入。</p>
        {device ? <p>本台的曲线与峰值由 {device.measuredUnits} 台合计均分。当前功率按单台记录峰值 × 负载比例计算，开关控制本次用电，不改变全天记录。</p>
          : <p>全天记录仅包含场景中已建模的 {SCENE_MEASURED_GROUPS.length} 类、{SCENE_MEASURED_TOTAL.units} 台设备；合计曲线与日耗电按这些设备重新计算。调整开关不会改动全天记录。</p>}
        {reference && <div className="space-y-1">
          <p className="font-medium text-foreground">资料表参考：{reference.model ?? reference.name}</p>
          <p>单台运行 / 参考功率：{reference.referencePower}</p>
          <p>此项保留资料表原值，与曲线中的记录峰值属于不同口径。</p>
          <Source source={DEVICE_SOURCE} range={`A${reference.row}:D${reference.row}`} />
        </div>}
    </CollapsibleContent>
  </Collapsible>
}

function Source({ source, range = source.range }: { source: WorkbookSource; range?: string }) {
  return <div className="space-y-1 break-words">
    <p>{source.file}</p>
    <p>{source.sheet} · {range}</p>
  </div>
}
