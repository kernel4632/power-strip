import assert from 'node:assert/strict'
import { createServer } from 'vite'

const server = await createServer({
  configFile: false,
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, hmr: false, ws: false },
})

try {
  const { computeRisk } = await server.ssrLoadModule('/src/workbench/risk.ts')
  const { useBenchStore, selectReadings } = await server.ssrLoadModule('/src/workbench/store.ts')
  const { BENCH_MAX_ITEMS, DEFAULT_BENCH_SETTINGS } = await server.ssrLoadModule('/src/workbench/catalog.ts')
  const { fitsPlacement, SOCKET_POSITIONS, TABLE_BOUNDS, plugPoint } = await server.ssrLoadModule('/src/workbench/layout.ts')
  const { resolveDragTarget } = await server.ssrLoadModule('/src/workbench/drag-target.ts')
  const { useBenchDrag } = await server.ssrLoadModule('/src/workbench/drag.ts')
  const store = useBenchStore
  const state = () => store.getState()
  const readings = () => selectReadings(state())
  const item = id => state().items.find(candidate => candidate.id === id)
  const base = { warningWatts: 200, limitWatts: 300 }

  assert.equal(computeRisk(199, base).status, 'normal')
  assert.equal(computeRisk(200, base).status, 'warning')
  assert.equal(computeRisk(300, base).status, 'overload')
  assert.equal(computeRisk(350, base).remainingWatts, -50)
  assert.equal(computeRisk(350, base).ratio, 1)
  assert.equal(computeRisk(-50, base).ratio, 0)

  const initial = readings()
  assert.equal(initial.connectedCount, 3)
  assert.equal(initial.runningCount, 3)
  assert.equal(initial.strip.watts, 1740)
  assert.equal(initial.room.watts, 2340)
  assert.deepEqual(state().settings, DEFAULT_BENCH_SETTINGS)
  assert.equal(item('item-phone').socket, null)
  assert.equal(item('item-phone').on, false)
  assert.equal(item('item-cooker').socket, null)
  assert.equal(item('item-cooker').on, false)
  assert.equal(item('item-kettle').socket, 0)
  assert.notDeepEqual(item('item-kettle').position, SOCKET_POSITIONS[0], 'plugging must retain the appliance on the table rather than teleport it onto the strip')

  const laptopBefore = { ...item('item-gaming-laptop') }
  state().setItemOn('item-kettle', false)
  assert.equal(readings().itemWatts['item-kettle'], 0)
  assert.equal(readings().itemWatts['item-gaming-laptop'], laptopBefore.on ? 230 : 0)
  assert.equal(item('item-gaming-laptop').on, laptopBefore.on)
  state().setItemOn('item-kettle', true)

  assert.equal(state().moveItem('item-phone', { socket: 3 }), true)
  assert.equal(item('item-phone').socket, 3)
  assert.equal(item('item-phone').on, false, 'socket assignment preserves on/off state')
  assert.equal(state().moveItem('item-cooker', { socket: 3 }), false, 'occupied outlet rejects insertion')
  assert.equal(item('item-cooker').socket, null, 'occupied outlet does not swap items')
  assert.equal(item('item-phone').socket, 3, 'occupied outlet preserves its existing item')
  assert.equal(state().moveItem('item-cooker', { socket: 9 }), false)

  state().setItemLoad('item-kettle', 250)
  assert.equal(item('item-kettle').load, 100)
  state().setItemLoad('item-kettle', 0)
  assert.equal(item('item-kettle').load, 0)
  assert.equal(readings().itemWatts['item-kettle'], 0)
  state().setItemLoad('item-kettle', 50)
  state().setItemCustomWatts('item-kettle', 1000)
  assert.equal(readings().itemWatts['item-kettle'], 500, 'custom rating is scaled by load')
  state().setItemOn('item-kettle', false)
  assert.equal(readings().itemWatts['item-kettle'], 0, 'custom rating is inactive while off')
  state().setItemOn('item-kettle', true)
  state().setItemCustomWatts('item-kettle', null)

  assert.equal(state().setThresholds('strip', 0, 2000), false)
  assert.equal(state().setThresholds('strip', 2500, 2000), false)
  assert.equal(state().setThresholds('strip', 2000, 10001), false)
  assert.equal(state().setThresholds('strip', 2000, 2500), true)
  assert.deepEqual(state().settings.strip, { warningWatts: 2000, limitWatts: 2500 })
  assert.equal(state().setBackgroundWatts(6000), true)
  assert.equal(state().settings.backgroundWatts, 5000)
  assert.equal(state().setBackgroundWatts(-20), true)
  assert.equal(state().settings.backgroundWatts, 0)
  state().setBackgroundWatts(600)
  assert.equal(state().setBackgroundWatts(Number.NaN), false)

  state().setMasterOn(false)
  assert.equal(readings().strip.watts, 0)
  assert.equal(readings().room.watts, state().settings.backgroundWatts)
  assert.equal(item('item-kettle').on, true, 'master switch does not alter individual switches')
  state().setMasterOn(true)
  assert.equal(readings().strip.watts + state().settings.backgroundWatts, readings().room.watts, 'background load belongs only to dorm total')

  const phone = item('item-phone')
  const originalPhone = { ...phone }
  assert.equal(state().moveItem(phone.id, { position: [3.5, 2.1] }), false, 'invalid exact drop must not teleport to a predefined pad')
  assert.deepEqual(item(phone.id), originalPhone)
  assert.equal(state().moveItem(phone.id, { position: [3.15, .05] }), true)
  const movedPhone = item(phone.id)
  assert.equal(movedPhone.socket, 3, 'moving the appliance keeps its plug connected')
  assert.deepEqual(movedPhone.position, [3.15, .05], 'valid drops keep the exact requested coordinates')
  assert.ok(movedPhone.position[0] - 0.33 / 2 >= TABLE_BOUNDS.minX - 1e-8)
  assert.ok(movedPhone.position[0] + 0.33 / 2 <= TABLE_BOUNDS.maxX + 1e-8)
  assert.ok(movedPhone.position[1] - 0.4 / 2 >= TABLE_BOUNDS.minZ - 1e-8)
  assert.ok(movedPhone.position[1] + 0.4 / 2 <= TABLE_BOUNDS.maxZ + 1e-8)
  assert.ok(fitsPlacement(movedPhone.kind, movedPhone.position, state().items, movedPhone.id))
  const cooker = item('item-cooker')
  const cookerBefore = { ...cooker }
  assert.equal(state().moveItem(cooker.id, { position: movedPhone.position }), false, 'colliding drop is rejected, not rerouted')
  assert.deepEqual(item(cooker.id), cookerBefore)
  assert.equal(state().addItem('phone', { position: movedPhone.position }), null, 'explicit catalog drops cannot be silently moved')
  assert.equal(state().disconnectItem(phone.id, [2, 1.8]), true)
  assert.equal(item(phone.id).socket, null)
  assert.deepEqual(item(phone.id).position, [3.15, .05], 'unplugging does not move the appliance')
  assert.deepEqual(plugPoint(item(phone.id)), [2, 1.8])

  state().reset()
  const drag = { kind: 'phone', itemId: null, pointerId: 7, clientX: 10, clientY: 10, startX: 10, startY: 10, mode: 'catalog', offset: [0, 0] }
  const unchanged = structuredClone(state().items)
  for (let index = 0; index < 40; index += 1) {
    const desired = [-1.5 + index * .017, 1.3]
    const target = resolveDragTarget(drag, desired, state().items)
    assert.deepEqual(target.position, desired, 'preview follows every small pointer movement, never snapping to pads')
    assert.equal(target.valid, true)
  }
  const collision = resolveDragTarget(drag, item('item-kettle').position, state().items)
  assert.equal(collision.valid, false)
  assert.deepEqual(collision.position, item('item-kettle').position, 'invalid preview stays under the pointer')
  const bodyOnStrip = resolveDragTarget({ ...drag, itemId: 'item-phone', mode: 'device' }, SOCKET_POSITIONS[3], state().items)
  assert.equal(bodyOnStrip.socket, null, 'only dragging a plug can snap to a socket')
  assert.equal(bodyOnStrip.valid, false, 'an appliance cannot be placed on top of the strip')
  const plugDrag = { ...drag, itemId: 'item-phone', mode: 'plug' }
  assert.equal(resolveDragTarget(plugDrag, SOCKET_POSITIONS[0], state().items).valid, false)
  const freeOutlet = resolveDragTarget(plugDrag, SOCKET_POSITIONS[3], state().items)
  assert.equal(freeOutlet.valid, true)
  assert.equal(freeOutlet.socket, 3)
  const offsetTarget = resolveDragTarget({ ...drag, itemId: 'item-phone', mode: 'device', offset: [.05, -.03] }, [-1.2, 1.33], state().items)
  assert.ok(Math.abs(offsetTarget.position[0] + 1.15) < 1e-9 && Math.abs(offsetTarget.position[1] - 1.3) < 1e-9, 'grab offset is preserved')
  assert.deepEqual(state().items, unchanged, 'previews never commit state')
  useBenchDrag.getState().start('phone', null, drag, 'catalog')
  useBenchDrag.getState().preview([-1.2, 1.3], null, true)
  assert.equal(useBenchDrag.getState().hasMoved, true)
  useBenchDrag.getState().cancel('test cancellation')
  assert.equal(useBenchDrag.getState().drag, null)
  assert.equal(useBenchDrag.getState().previewPosition, null)
  assert.equal(useBenchDrag.getState().message, 'test cancellation')

  state().reset()
  let added = 0
  while (state().items.length < BENCH_MAX_ITEMS) {
    const id = state().addItem('phone')
    assert.ok(id, 'an item can be added below the cap')
    added += 1
  }
  assert.equal(added, BENCH_MAX_ITEMS - 5)
  assert.equal(state().addItem('phone'), null, 'item cap is enforced')
  const selected = state().items.at(-1).id
  state().select(selected)
  assert.equal(state().selectionId, selected)
  state().removeItem(selected)
  assert.equal(state().selectionId, null, 'removing selection clears it')

  state().applyPreset('study')
  assert.equal(readings().strip.watts, 1740)
  state().setThresholds('strip', 1800, 2400)
  state().applyPreset('study')
  assert.deepEqual(state().settings.strip, { warningWatts: 1800, limitWatts: 2400 }, 'study preset replaces appliances but preserves user thresholds')
  state().reset()
  state().applyPreset('strip-warning')
  assert.equal(readings().strip.status, 'warning')
  assert.ok(readings().strip.watts < readings().strip.limitWatts)
  assert.ok(readings().connectedCount <= SOCKET_POSITIONS.length)
  state().applyPreset('room-warning')
  assert.equal(readings().room.status, 'warning')
  assert.ok(readings().room.watts < readings().room.limitWatts)
  state().applyPreset('overload')
  assert.equal(readings().strip.status, 'overload')
  assert.ok(readings().strip.watts > readings().strip.limitWatts)
  assert.ok(readings().connectedCount <= SOCKET_POSITIONS.length)

  state().setThresholds('strip', 9500, 10000)
  state().applyPreset('overload')
  assert.ok(readings().strip.watts > readings().strip.limitWatts, 'overload preset adapts to high custom limits')
  assert.ok(state().items.some(candidate => candidate.customWatts !== null))

  state().reset()
  assert.deepEqual(state().settings, DEFAULT_BENCH_SETTINGS)
  assert.equal(state().selectionId, null)
  assert.equal(readings().strip.watts, 1740)
  console.log('Workbench checks passed: continuous drag targets, exact drops, overlap rejection, independent plug/body movement, cancellation, risk boundaries, totals, settings and presets.')
} finally {
  await server.close()
}
