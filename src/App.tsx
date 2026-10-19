import { useState } from 'react'
import { Scene } from './scene/Scene'
import { usePowerStore } from './store/usePowerStore'
import { PowerPanel } from './ui/PowerPanel'

export default function App() {
  const outlets = usePowerStore((state) => state.outlets)
  const toggle = usePowerStore((state) => state.toggle)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  return (
    <div className="app">
      <div className="app__scene">
        <Scene
          outlets={outlets}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onToggle={toggle}
        />
      </div>
      <PowerPanel selectedId={selectedId} onSelect={setSelectedId} />
    </div>
  )
}
