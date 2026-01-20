"use client"
import React from "react"

export interface AspectRatioProps extends React.HTMLAttributes<HTMLDivElement> {
  ratio?: number
  children?: React.ReactNode
}

export const AspectRatio = React.forwardRef<HTMLDivElement, AspectRatioProps>(
  ({ ratio = 16 / 9, style, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          aspectRatio: String(ratio),
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    )
  }
)

AspectRatio.displayName = "AspectRatio"
