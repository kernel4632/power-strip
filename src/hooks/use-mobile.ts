import * as React from 'react'

function readBreakpoint() {
  const token = getComputedStyle(document.documentElement)
    .getPropertyValue('--breakpoint-md')
    .trim()
  // 首帧样式可能还没应用，回退到 Tailwind 默认 md 断点。
  return token || '48rem'
}

function matchesMobile() {
  if (typeof window === 'undefined') return false
  return window.matchMedia(`(width < ${readBreakpoint()})`).matches
}

export function useIsMobile() {
  // 同步取值，避免首帧按桌面渲染再闪成移动端（Sheet 会从右侧跳到下方）。
  const [isMobile, setIsMobile] = React.useState<boolean>(matchesMobile)

  React.useEffect(() => {
    const mql = window.matchMedia(`(width < ${readBreakpoint()})`)
    const onChange = () => setIsMobile(mql.matches)
    mql.addEventListener('change', onChange)
    setIsMobile(mql.matches)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isMobile
}
