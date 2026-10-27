import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { RefObject } from 'react'
import { actionConnector, placeDeviceActions, projectActionObstacles } from './action-layout'
import type { ActionRect } from './action-layout'
import { useBenchStore } from './store'

export interface ActionProjectionProps {
  panelRef: RefObject<HTMLDivElement | null>
  connectorRef: RefObject<HTMLDivElement | null>
  docked: boolean
  dock: (docked: boolean) => void
}

/** Project after the camera update, without rerendering React on each orbit frame. */
export function DeviceActionProjection({ panelRef, connectorRef, docked, dock }: ActionProjectionProps) {
  const previous = useRef<{ id: string; width: number; height: number; panel: ActionRect } | null>(null)
  useFrame(({ scene, camera, size }) => {
    const panel = panelRef.current
    const connector = connectorRef.current
    if (!panel) {
      if (connector) connector.hidden = true
      return
    }
    const state = useBenchStore.getState()
    const selected = state.selectedId
    if (!selected) return
    const obstacles = projectActionObstacles(scene, camera, state.items, size)
    const anchor = obstacles.find(rect => rect.id === `bench-body-${selected}`)
    const dimensions = { width: panel.offsetWidth, height: panel.offsetHeight }
    let position: ActionRect | null
    if (docked) {
      // This row is outside the canvas and cannot cover a projected appliance.
      position = { id: 'device-actions', x: (size.width - dimensions.width) / 2, y: size.height + 8, ...dimensions }
    } else {
      const last = previous.current
      const stablePosition = last?.id === selected && last.width === size.width && last.height === size.height ? last.panel : undefined
      position = anchor ? placeDeviceActions(anchor, obstacles, size, dimensions, stablePosition) : null
      if (position) previous.current = { id: selected, width: size.width, height: size.height, panel: position }
    }
    if (!position) {
      panel.style.visibility = 'hidden'
      if (connector) connector.hidden = true
      dock(true)
      return
    }
    panel.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`
    panel.style.visibility = 'visible'
    panel.dataset.placement = docked ? 'docked' : 'floating'
    if (!connector) return
    connector.hidden = !anchor
    if (!anchor) return
    const endpoints = actionConnector(anchor, position)
    const line = connector.querySelector('line')
    const dot = connector.querySelector('circle')
    for (const [key, value] of Object.entries(endpoints)) line?.setAttribute(key, String(value))
    dot?.setAttribute('cx', String(endpoints.x1))
    dot?.setAttribute('cy', String(endpoints.y1))
  })
  return null
}
