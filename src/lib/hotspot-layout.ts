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

/** Keep full readouts visible, with the chosen device closest to its anchor. */
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
    // Compact icons can fit beside labels; don't let them split a full row.
    (a, b) =>
      Number(b.width > b.height) - Number(a.width > a.height) ||
      Number(b.id === selected) - Number(a.id === selected) ||
      b.width - a.width,
  )) {
    const obstacles = [...placed, ...reserved]
    const origin = { x: item.x - item.width / 2, y: item.y - item.height / 2 }
    // Adjacent rectangle edges leave usable gaps even when every label is wide.
    const xs = [origin.x, 8, width - item.width - 8]
    const ys = [origin.y, 8, height - item.height - 8]
    for (const box of obstacles) {
      xs.push(box.x - item.width - 8, box.x + box.width + 8)
      ys.push(box.y - item.height - 8, box.y + box.height + 8)
    }
    const candidate = xs
      .flatMap((x) =>
        ys.map((y) => ({
          ...item,
          x: Math.max(8, Math.min(width - item.width - 8, x)),
          y: Math.max(8, Math.min(height - item.height - 8, y)),
        })),
      )
      .sort(
        (a, b) =>
          (a.x - origin.x) ** 2 + (a.y - origin.y) ** 2 -
          (b.x - origin.x) ** 2 - (b.y - origin.y) ** 2,
      )
      .find((box) => !obstacles.some((other) => intersects(box, other)))
    if (candidate) placed.push(candidate)
  }
  return placed
}
