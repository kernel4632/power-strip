import * as React from 'react'

function readBreakpoint() {
  const token = getComputedStyle(document.documentElement)
    .getPropertyValue('--breakpoint-md')
    .trim()
  // 场景与侧栏需要合计 1024px；更窄时用底部抽屉保留模型空间。
  return token || '64rem'
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
