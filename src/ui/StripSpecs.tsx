import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DESK_STRIP, type StripSpec } from '../data/strips'
import { DataSource } from './DataSource'

export function StripSpecs() {
  return (
    <Card className="gap-3 rounded-none border-0 bg-transparent py-0 shadow-none">
      <CardHeader className="px-2"><CardTitle>插排参考规格</CardTitle></CardHeader>
      <CardContent className="space-y-3 px-2">
        <Spec spec={DESK_STRIP} />
        <DataSource strips />
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
