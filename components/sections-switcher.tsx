"use client"
import React from "react"

export default function SectionsSwitcher(props: any) {
  // minimal: render children or a placeholder depending on props
  return <div className="sections-switcher-root">{props.children ?? null}</div>
}
