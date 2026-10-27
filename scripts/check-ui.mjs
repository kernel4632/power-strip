import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, relative } from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url))
const walk = (folder) =>
  readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const path = join(folder, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
const assemblies = [
  join(root, 'src/App.tsx'),
  join(root, 'src/workbench/WorkbenchPage.tsx'),
  join(root, 'src/workbench/WorkbenchSidebar.tsx'),
  join(root, 'src/workbench/WorkbenchPalette.tsx'),
  ...walk(join(root, 'src/ui')),
]
const primitives = walk(join(root, 'src/components/ui'))
const failures = []
for (const path of assemblies) {
  const text = readFileSync(path, 'utf8')
  const name = relative(root, path)
  if (/<(?:button|input|select|textarea|svg|progress|dialog)\b/.test(text))
    failures.push(
      `${name}: use a shadcn primitive instead of a native UI control`,
    )
  if (/\bstyle\s*=/.test(text))
    failures.push(`${name}: inline visual styles are not allowed`)
  if (/from ['"](?:@radix-ui\/|radix-ui)/.test(text))
    failures.push(`${name}: import the shadcn component, not a raw primitive`)
}
for (const path of [...assemblies, ...primitives]) {
  const text = readFileSync(path, 'utf8')
  const name = relative(root, path)
  if (/\[[^\]\n]*\d(?:px|rem)\b/.test(text))
    failures.push(
      `${name}: arbitrary literal dimensions must use global tokens`,
    )
  if (
    /(?:bg|text|border|fill|stroke)-(?:white|black|(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+)\b/.test(
      text,
    )
  )
    failures.push(`${name}: palette utilities must use semantic theme colors`)
  if (/(?:bg|text|border|fill|stroke)-\[(?:#|rgb|hsl|oklch)/.test(text))
    failures.push(`${name}: literal colors are not allowed`)
}
const css = readFileSync(join(root, 'src/index.css'), 'utf8')
for (const line of css.split('\n')) {
  if (/^\s*\.[\w-]/.test(line) && line.trim() !== '.dark {')
    failures.push(
      'src/index.css: component CSS is not allowed; compose shadcn with Tailwind utilities',
    )
}
if (failures.length) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else {
  console.log(
    `UI policy passed: ${assemblies.length} assemblies, ${primitives.length} UI primitives; no native controls, inline visual styles, or literal color/spacing overrides.`,
  )
}
