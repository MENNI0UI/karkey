'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

// Lightweight internal Tooltip implementation (no external deps)

type TooltipContextValue = {
  open: boolean
  setOpen: (v: boolean) => void
  side?: 'top' | 'right' | 'bottom' | 'left'
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null)

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function Tooltip({ children, defaultOpen = false, side }: { children: React.ReactNode; defaultOpen?: boolean; side?: TooltipContextValue['side'] }) {
  const [open, setOpen] = React.useState(defaultOpen)
  return <TooltipContext.Provider value={{ open, setOpen, side }}>{children}</TooltipContext.Provider>
}

export const TooltipTrigger = React.forwardRef<HTMLButtonElement, React.HTMLAttributes<HTMLButtonElement> & { asChild?: boolean }>(
  ({ children, className, ...props }, ref) => {
    const ctx = React.useContext(TooltipContext)
    const onEnter = () => ctx?.setOpen(true)
    const onLeave = () => ctx?.setOpen(false)
    const onClick = () => ctx && ctx.setOpen(!ctx.open)

    return (
      <button
        ref={ref}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onFocus={onEnter}
        onBlur={onLeave}
        onClick={onClick}
        type="button"
        className={cn('relative inline-flex', className)}
        {...props}
      >
        {children}
      </button>
    )
  },
)
TooltipTrigger.displayName = 'TooltipTrigger'

export const TooltipContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { sideOffset?: number }>(
  ({ className, children, sideOffset = 8, ...props }, ref) => {
    const ctx = React.useContext(TooltipContext)
    const side = ctx?.side || 'top'

    const base = 'z-50 pointer-events-none rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md'
    const pos: Record<string, string> = {
      top: `bottom-[calc(100%+${sideOffset}px)] left-1/2 -translate-x-1/2`,
      bottom: `top-[calc(100%+${sideOffset}px)] left-1/2 -translate-x-1/2`,
      left: `right-[calc(100%+${sideOffset}px)] top-1/2 -translate-y-1/2`,
      right: `left-[calc(100%+${sideOffset}px)] top-1/2 -translate-y-1/2`,
    }

    return (
      <div
        ref={ref}
        role="tooltip"
        className={cn(
          base,
          'absolute whitespace-pre-line transition-opacity duration-150',
          ctx?.open ? 'opacity-100' : 'opacity-0',
          pos[side],
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  },
)
TooltipContent.displayName = 'TooltipContent'

export { Tooltip as default }
