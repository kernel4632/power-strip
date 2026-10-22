export type HotspotBox = {
  id: string
  x: number
  y: number
  width: number
  height: number
}
const intersects = (a: HotspotBox, b: HotspotBox) =>
  a.x < b.x + b.width + 8 &&
  a.x + a.width + 8 > b.x &&
  a.y < b.y + b.height + 8 &&
  a.y + a.height + 8 > b.y

/** Keep the chosen object closest to its anchor; place the others in free nearby slots. */
export function placeHotspots(
  items: HotspotBox[],
  width: number,
  height: number,
  selected: string | null,
) {
  const placed: HotspotBox[] = []
  const reserved = [
    { id: 'tools', x: width - 200, y: 8, width: 192, height: 56 },
  ]
  for (const item of [...items].sort(
    (a, b) => Number(b.id === selected) - Number(a.id === selected),
  )) {
    const offsets = [[0, 0]]
    for (let ring = 1; ring <= 12; ring++) {
      for (const [dx, dy] of [
        [0, -1],
        [0, 1],
        [-1, 0],
        [1, 0],
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ])
        offsets.push([dx * ring * 52, dy * ring * 52])
    }
    const candidate = offsets
      .map(([dx, dy]) => ({
        ...item,
        x: Math.max(
          8,
          Math.min(width - item.width - 8, item.x - item.width / 2 + dx),
        ),
        y: Math.max(
          8,
          Math.min(height - item.height - 8, item.y - item.height / 2 + dy),
        ),
      }))
      .find(
        (box) =>
          ![...placed, ...reserved].some((other) => intersects(box, other)),
      )
    if (candidate) placed.push(candidate)
  }
  return placed
}
