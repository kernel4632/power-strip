import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { CIRCUIT_LIMIT } from '../data/catalog'
import { STRIP_SPECS } from '../data/strips'
import { cn } from '@/lib/utils'

const BY_PRICE = [...STRIP_SPECS].sort((a, b) => a.price - b.price)

/** 在售插排规格对照，默认收起，避免抢走负荷数据的位置。 */
export function StripSpecs() {
  const [open, setOpen] = useState(false)
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="gap-3 rounded-none border-0 bg-transparent py-0 shadow-none">
        <CardHeader className="px-2">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="h-auto w-full justify-between gap-2 px-0"
            >
              <CardTitle>在售插排规格</CardTitle>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                {STRIP_SPECS.length} 款
                <ChevronDown
                  className={cn(
                    'transition-transform duration-(--motion-control) ease-ui',
                    open && 'rotate-180',
                  )}
                />
              </span>
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-2 px-2">
            <div className="flex items-center justify-between gap-2 rounded-md bg-secondary px-3 py-2">
              <span className="text-sm">本设计</span>
              <span className="text-xs tabular-nums text-muted-foreground">
                4 路独立通断 · {CIRCUIT_LIMIT} W
              </span>
            </div>
            <Separator />
            {BY_PRICE.map((strip) => (
              <div
                key={strip.name}
                className="flex items-center justify-between gap-3 py-1"
              >
                <div className="min-w-0 space-y-1">
                  <div className="truncate text-sm">{strip.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {strip.ports} · {strip.size}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm tabular-nums">
                    ¥{strip.price.toFixed(2)}
                  </div>
                  <Badge variant="secondary">{strip.maxW} W</Badge>
                </div>
              </div>
            ))}
            <CardDescription>
              在售 12 款插排的孔位、最大功率与参考价；价格为表格记录值，未含运费。
            </CardDescription>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
