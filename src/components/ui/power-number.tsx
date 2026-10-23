import NumberFlow from '@number-flow/react'

const format = { maximumFractionDigits: 1 }
const transformTiming = { duration: 280, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
const opacityTiming = { duration: 140, easing: 'ease-out' }

/** NumberFlow keeps the final value accessible and respects reduced motion. */
export function PowerNumber({ value }: { value: number }) {
  return (
    <NumberFlow
      value={value}
      locales="zh-CN"
      format={format}
      transformTiming={transformTiming}
      opacityTiming={opacityTiming}
      className="font-sans tabular-nums"
    />
  )
}
