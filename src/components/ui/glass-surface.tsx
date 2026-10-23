import { useEffect, useImperativeHandle, useRef, useState, type ComponentProps } from 'react'
import LiquidGlass from 'liquid-glass-react'
import { cn } from '@/lib/utils'

const STILL_MOUSE = { x: 0, y: 0 }

/** Decorative material only. Buttons, focus, ARIA and events stay with shadcn.
 * ResizeObserver also follows the power card's disclosure and responsive layout;
 * upstream only measures on mount/window resize, so remeasure on settled bounds.
 */
export function GlassSurface({ className, children, ref, ...props }: ComponentProps<'div'>) {
  const surface = useRef<HTMLDivElement>(null)
  useImperativeHandle(ref, () => surface.current!, [])
  const [geometry, setGeometry] = useState({ width: 0, height: 0, radius: 0 })
  useEffect(() => {
    const element = surface.current
    if (!element) return
    let timer: ReturnType<typeof setTimeout>
    const observer = new ResizeObserver(() => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        const rect = element.getBoundingClientRect()
        const radius = Math.min(parseFloat(getComputedStyle(element).borderTopLeftRadius), rect.width / 2, rect.height / 2)
        setGeometry(previous => {
          const next = { width: Math.round(rect.width), height: Math.round(rect.height), radius }
          return previous.width === next.width && previous.height === next.height && previous.radius === next.radius ? previous : next
        })
      }, 80)
    })
    observer.observe(element)
    return () => { clearTimeout(timer); observer.disconnect() }
  }, [])

  return <div
    {...props}
    ref={surface}
    data-slot="glass-surface"
    className={cn('relative isolate rounded-2xl border border-glass-edge bg-glass-tint text-foreground shadow-glass', className)}
  >
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]">
      {geometry.width > 0 && geometry.height > 0 && <LiquidGlass
        key={`${geometry.width}:${geometry.height}:${geometry.radius}`}
        className="size-full [&>.glass]:size-full [&>.glass]:shadow-none! [&>.glass>div]:hidden"
        style={{ position: 'absolute', top: '50%', left: '50%', width: '100%', height: '100%' }}
        cornerRadius={geometry.radius}
        padding="0"
        displacementScale={24}
        blurAmount={0.04}
        saturation={125}
        aberrationIntensity={0.6}
        elasticity={0}
        globalMousePos={STILL_MOUSE}
        mouseOffset={STILL_MOUSE}
      ><span /></LiquidGlass>}
    </div>
    {children}
  </div>
}
