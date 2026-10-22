import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { STRIP_SPECS, type StripSpec } from '../data/strips'

export function StripSpecs({ current }: { current?: StripSpec }) {
  return (
    <Card className="gap-3 rounded-none border-0 bg-transparent py-0 shadow-none">
      <CardHeader className="px-2"><CardTitle>{current ? '插排参考规格' : '插排资料'}</CardTitle></CardHeader>
      <CardContent className="space-y-3 px-2">
        {current && <Spec spec={current} />}
        <Collapsible>
          <CollapsibleTrigger asChild><Button variant="outline" className="w-full">查看 12 款插排</Button></CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-3">
            {STRIP_SPECS.map(spec => <Spec key={spec.id} spec={spec} />)}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}
function Spec({ spec }: { spec: StripSpec }) {
  return <Card className="gap-2 py-3 shadow-none">
    <CardHeader className="px-3"><CardTitle className="text-sm">{spec.name}</CardTitle></CardHeader>
    <CardContent className="space-y-2 px-3 text-sm">
      <div className="flex flex-wrap gap-2"><Badge variant="secondary">{spec.maxW} W</Badge><Badge variant="outline">¥{spec.price.toFixed(2)}</Badge></div>
      <div>{spec.ports}</div><div>{spec.size}</div>
    </CardContent>
  </Card>
}
