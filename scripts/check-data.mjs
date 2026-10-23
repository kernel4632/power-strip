import assert from 'node:assert/strict'
import { createServer } from 'vite'

const server = await createServer({ configFile: false, optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true } })
try {
  const { MEASURED_GROUPS: groups, MEASURED_TOTAL: total } = await server.ssrLoadModule('/src/data/measured.ts')
  const { DEVICE_CATALOG: devices, STATIONS, deviceReading } = await server.ssrLoadModule('/src/data/catalog.ts')
  const { SCENE_MEASURED_GROUPS: sceneGroups, SCENE_MEASURED_TOTAL: sceneTotal } = await server.ssrLoadModule('/src/data/sceneMeasured.ts')
  const { STRIP_SPECS: strips, DESK_STRIP } = await server.ssrLoadModule('/src/data/strips.ts')
  const { DEVICE_REFERENCES: references, DEVICE_REFERENCE_MAP: refMap, POWER_SOURCE, STRIP_SOURCE, DEVICE_SOURCE } = await server.ssrLoadModule('/src/data/references.ts')
  const { usePowerStore: store } = await server.ssrLoadModule('/src/store/usePowerStore.ts')
  const near = (a, b) => assert.ok(Math.abs(a-b) < 1e-7, `${a} != ${b}`)
  const inWaveRange = (watts, ceiling) => assert.ok(watts >= ceiling * 0.94 - 1e-7 && watts <= ceiling + 1e-7, `${watts} outside simulated range for ${ceiling}`)
  const at = i => new Date(Date.parse('2026-10-22T00:00:00+08:00') + i * 600000)
  assert.equal(groups.length, 12)
  assert.equal(strips.length, 12)
  assert.deepEqual(references.map(r => r.id), groups.map(g => g.id))
  for (const source of [POWER_SOURCE, STRIP_SOURCE, DEVICE_SOURCE]) {
    assert.match(source.sha256, /^[a-f0-9]{64}$/)
    assert.ok(source.file.endsWith('.xlsx') && source.sheet && source.range)
  }
  // Source specifications and recorded peaks are different quantities: retain both.
  assert.equal(refMap.macbook.referencePower, '35 W')
  assert.equal(refMap.gaming.model, '惠普暗影精灵11')
  assert.equal(refMap.gaming.referencePower, '230 W')
  assert.equal(refMap.ac.referencePower, '1060(130-1400)W')
  assert.equal(refMap.led.model, null)
  assert.equal(DESK_STRIP.name, '公牛407四插位')
  assert.equal(DESK_STRIP.maxW, 2500)
  assert.equal(DESK_STRIP.price, 29.8)
  assert.ok(STATIONS.every(s => s.limit === DESK_STRIP.maxW))
  assert.equal(devices.length, 14)
  assert.equal(new Set(devices.map(d => d.id)).size, devices.length)
  const represented = groups.filter(g => devices.some(d => d.measuredGroup === g.id))
  assert.equal(represented.length, 6)
  assert.deepEqual(sceneGroups.map(g => g.id).sort(), ['android', 'gaming', 'iphone', 'lamp', 'macbook', 'tablet'])
  assert.equal(sceneTotal.units, 14)
  assert.equal(sceneTotal.series.length, 144)
  near(sceneTotal.energyWh, 3361.1666666666665)
  near(sceneTotal.avgW, 140.04861111111111)
  assert.equal(sceneTotal.peakW, 590)
  assert.equal(sceneTotal.series[0], 590)
  for (const g of represented) assert.equal(devices.filter(d => d.measuredGroup === g.id).length, g.units, g.id)
  assert.ok(devices.filter(d => d.measuredGroup === 'gaming').every(d => d.kind === 'laptop'))
  for (const g of groups) {
    assert.equal(g.series.length, 144)
    near(g.series.reduce((a,b) => a+b, 0)/6, g.energyWh)
    near(g.avgW*24, g.energyWh)
  }
  near(total.energyWh, 21316.333333333332)
  assert.equal(total.peakW, 3190)
  // 100% load is each unit's nameplate figure, so the room total is a sum of ratings.
  const nameplate = g => g.units * Number.parseFloat(refMap[g.id].referencePower)
  const expected = represented.reduce((sum,g) => sum+nameplate(g),0)
  // Ratings may be summed; coincident peaks may not. 804 W vs the 590 W recorded peak is by design.
  assert.equal(expected, 804)
  assert.ok(expected > sceneTotal.peakW)
  assert.ok(Object.values(store.getState().devices).every(d => d.watts > 0))
  for (let i=0; i<144; i++) {
    near(groups.reduce((sum,g) => sum+g.series[i],0), total.series[i])
    near(represented.reduce((sum,g) => sum+g.series[i],0), sceneTotal.series[i])
    store.getState().tick(0, at(i).getTime())
    near(Object.values(store.getState().devices).reduce((sum,d) => sum+d.watts,0), expected)
    for (const g of represented) near(devices.filter(d=>d.measuredGroup===g.id).reduce((sum,d)=>sum+deviceReading(d).watts,0),nameplate(g))
  }
  // Even the formerly all-zero 11:40 interval leaves every switch-on model powered.
  store.getState().tick(0, Date.parse('2026-10-22T11:40:00+08:00'))
  assert.ok(Object.values(store.getState().devices).every(d => d.watts > 0))
  const laptopW = deviceReading(devices.find(d => d.id === 's1-laptop')).watts
  const target='s1-laptop', now=at(0).getTime()
  store.getState().toggle(target)
  assert.equal(store.getState().devices[target].watts,0)
  near(store.getState().devices['s3-laptop'].watts,laptopW)
  store.getState().toggle(target); store.getState().setLevel(target,0.5)
  inWaveRange(store.getState().devices[target].watts,laptopW/2)
  const start=store.getState().devices[target].energyWh
  let integrated = 0
  const readings = []
  for(let t=1;t<=60;t++) {
    const previous = store.getState().devices[target].watts
    store.getState().tick(1,now+t*1000)
    const watts = store.getState().devices[target].watts
    inWaveRange(watts,laptopW/2)
    readings.push(watts)
    integrated += (previous + watts) / 2 / 3600
  }
  assert.ok(Math.max(...readings) - Math.min(...readings) > 5, 'unchanged 50% load must keep fluctuating')
  assert.ok(Math.abs(store.getState().devices[target].energyWh-start - integrated) < 0.001, 'exact energy agrees with one-second trapezoidal estimate')
  store.getState().setStrip('s1',false)
  assert.ok(devices.filter(d=>d.stationId==='s1').every(d=>store.getState().devices[d.id].watts===0))
  store.getState().setMaster(false)
  assert.ok(Object.values(store.getState().devices).every(d=>d.watts===0))
  store.getState().tick(0, now)
  assert.equal(Object.values(store.getState().devices).reduce((sum,d) => sum+d.watts,0), 0)
  store.getState().setStrip('s1',true)
  assert.equal(store.getState().devices[target].watts,0)
  store.getState().setMaster(true)
  inWaveRange(store.getState().devices[target].watts,laptopW/2)
  store.getState().setMode('away')
  assert.ok(Object.values(store.getState().devices).every(d=>d.watts===0))
  store.getState().setMode('study')
  assert.ok(Object.values(store.getState().devices).every(d=>d.watts>0))
  // MacBook fluctuation is based on its 35 W reference, never the recorded 30 W peak.
  inWaveRange(store.getState().devices['s2-laptop'].watts,35)
  inWaveRange(store.getState().devices['s4-laptop'].watts,35)
  const macBefore = store.getState().devices['s2-laptop'].watts
  const otherMac = store.getState().devices['s4-laptop'].watts
  store.getState().setLevel('s2-laptop',0.5)
  near(store.getState().devices['s2-laptop'].watts,macBefore/2)
  near(store.getState().devices['s4-laptop'].watts,otherMac)
  store.getState().setLevel('s2-laptop',1)
  near(store.getState().devices['s2-laptop'].watts,macBefore)
  store.getState().toggle('s2-laptop')
  assert.equal(store.getState().devices['s2-laptop'].watts,0)
  console.log('Data checks passed: workbook provenance, scene scope, historical totals, 144 intervals, reference-based fluctuation bounds, clock independence, immediate switches, isolated load scaling and integrated energy.')
} finally { await server.close() }
