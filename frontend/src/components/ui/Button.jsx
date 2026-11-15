import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn.js'

const variants = {
  primary:
    'bg-primary text-primary-fg shadow-[var(--shadow-sm)] hover:bg-primary-hover disabled:opacity-50',
  secondary:
    'bg-surface-2 text-text hover:bg-border disabled:opacity-50',
  outline:
    'border border-border text-text bg-transparent hover:bg-surface-2 disabled:opacity-50',
  ghost: 'text-text hover:bg-surface-2 disabled:opacity-50',
  danger: 'bg-error text-white shadow-[var(--shadow-sm)] hover:opacity-90 disabled:opacity-50',
}

const sizes = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-base gap-2',
  icon: 'h-10 w-10 justify-center',
}

export function Button({
  as: Comp = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}) {
  return (
    <Comp
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition duration-150 cursor-pointer select-none active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </Comp>
  )
}
