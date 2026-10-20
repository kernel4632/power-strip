import type { ComponentProps } from 'react'

type ButtonProps = ComponentProps<'button'> & {
  variant?: 'primary' | 'outline' | 'ghost'
  size?: 'default' | 'icon'
}

// Local CSS implementation inspired by shadcn/ui's button variants.
export function Button({
  variant = 'outline',
  size = 'default',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`ui-button ui-button--${variant} ui-button--${size} ${className}`}
      {...props}
    />
  )
}
