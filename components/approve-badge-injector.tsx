"use client"
import { useEffect } from "react"

export default function ApproveBadgeInjector() {
  useEffect(() => {
    const CONTAINER_SELECTOR = "#auctions-grid"
    const BADGE_CLASS = "karkey-approved-badge"

    const badgeStyle = (el: HTMLElement) => {
      Object.assign(el.style, {
        position: "absolute",
        right: "6px",      // bottom-right inside avatar
        bottom: "6px",     // bottom-right inside avatar
        width: "16px",
        height: "16px",
        backgroundImage: `url("/icons/approve.png")`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        borderRadius: "50%",
        zIndex: "60",
        pointerEvents: "none",
        boxShadow: "0 2px 6px rgba(0,0,0,0.14)",
      } as Partial<CSSStyleDeclaration>)
    }

    const addBadgeTo = (avatarEl: HTMLElement | HTMLImageElement) => {
      try {
        const container = (avatarEl.nodeName === "IMG" ? (avatarEl.parentElement ?? avatarEl) : avatarEl) as HTMLElement
        if (!container) return
        const auctionsGrid = document.querySelector(CONTAINER_SELECTOR)
        if (!auctionsGrid || !auctionsGrid.contains(container)) return
        if (container.querySelector(`.${BADGE_CLASS}`)) return

        // ensure positioned parent
        const prevPos = window.getComputedStyle(container).position
        if (prevPos === "static" || !prevPos) {
          container.style.position = container.style.position || "relative"
        }
        container.style.overflow = container.style.overflow || "visible"

        const span = document.createElement("span")
        span.className = BADGE_CLASS
        badgeStyle(span)
        container.appendChild(span)
      } catch {
        // ignore
      }
    }

    const scanAndAdd = () => {
      const selectors = [
        `${CONTAINER_SELECTOR} .rounded-full`,
        `${CONTAINER_SELECTOR} .avatar`,
        `${CONTAINER_SELECTOR} .card-avatar`,
        `${CONTAINER_SELECTOR} img.rounded-full`,
      ]
      const nodes = document.querySelectorAll<HTMLElement>(selectors.join(","))
      nodes.forEach((n) => addBadgeTo(n))
    }

    const initialTimeout = window.setTimeout(scanAndAdd, 120)

    const grid = document.querySelector(CONTAINER_SELECTOR)
    let mo: MutationObserver | null = null
    if (grid) {
      mo = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.addedNodes && m.addedNodes.length > 0) {
            scanAndAdd()
            break
          }
        }
      })
      mo.observe(grid, { childList: true, subtree: true })
    }

    return () => {
      clearTimeout(initialTimeout)
      if (mo) mo.disconnect()
    }
  }, [])

  return null
}
