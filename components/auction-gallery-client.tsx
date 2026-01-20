"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Countdown from "@/components/Countdown";

export default function AuctionGalleryClient({
  photos = [],
  initialIndex = 0,
  alt = "Vehicle photo",
  thumbnailPosition = "left",
  // reduce gap slightly and make defaults smaller so many thumbs fit
  thumbnailGap = 8,
  containerHeight = 420,
  // smaller defaults to force thumbnails to shrink when many images
  minThumbnailSize = 24,
  maxThumbnailSize = 64,
  // increase multiplier so thumbs are a bit wider than before (makes them visually wider)
  widthMultiplier = 1.25,
  // when true, render thumbnail column flush/anchored to the left of the gallery wrapper
  flush = false,
  // NEW: optional auction timer props
  startDate,
  endDate,
  serverOffsetMs,
}: {
  photos?: string[];
  initialIndex?: number;
  alt?: string;
  thumbnailPosition?: "left" | "right";
  thumbnailGap?: number;
  containerHeight?: number;
  minThumbnailSize?: number;
  maxThumbnailSize?: number;
  widthMultiplier?: number;
  flush?: boolean;
  startDate?: string | null;
  endDate?: string | null;
  serverOffsetMs?: number | null;
}) {
  const safePhotos = Array.isArray(photos) ? photos : [];
  const count = Math.max(0, safePhotos.length);
  const [index, setIndex] = useState<number>(() =>
    Math.min(Math.max(Number(initialIndex) || 0, 0), Math.max(0, count - 1))
  );

  // compute thumbnail height so ALL thumbnails fit within containerHeight
  // then set width = height * widthMultiplier so thumbnails are wider than tall
  const [thumbHeight, setThumbHeight] = useState<number>(Math.min(maxThumbnailSize, 64));
  const [thumbWidth, setThumbWidth] = useState<number>(Math.round(Math.min(maxThumbnailSize, 64) * widthMultiplier));

  useEffect(() => {
    if (count === 0) {
      const h = Math.min(maxThumbnailSize, 48);
      setThumbHeight(h);
      setThumbWidth(Math.round(h * widthMultiplier));
      return;
    }
    const totalGaps = Math.max(0, (count - 1) * thumbnailGap);
    const usable = Math.max(0, containerHeight - totalGaps - 8); // small padding
    const raw = Math.floor(usable / count);
    // clamp more aggressively so thumbnails shrink when many images
    const clamped = Math.max(minThumbnailSize, Math.min(maxThumbnailSize, raw));
    const w = Math.max(minThumbnailSize, Math.min(Math.round(clamped * widthMultiplier), Math.round(maxThumbnailSize * 1.8)));
    setThumbHeight(clamped);
    setThumbWidth(w);
  }, [count, containerHeight, thumbnailGap, minThumbnailSize, maxThumbnailSize, widthMultiplier]);

  // keep index valid if photos change
  useEffect(() => {
    if (index >= safePhotos.length) setIndex(Math.max(0, safePhotos.length - 1));
  }, [safePhotos.length, index]);

  // navigation helpers used by overlay arrows and keyboard handlers (ensure defined)
  const prev = () => setIndex((i) => (safePhotos.length ? Math.max(0, i - 1) : 0));
  const next = () => setIndex((i) => (safePhotos.length ? Math.min(safePhotos.length - 1, i + 1) : 0));

  // show arrows on hover or touch (so they are clickable)
  const [showArrows, setShowArrows] = useState(false);
  let touchHideTimer: number | undefined;

  const onEnter = () => {
    if (typeof window !== "undefined") {
      if (touchHideTimer) window.clearTimeout(touchHideTimer);
    }
    setShowArrows(true);
  };
  const onLeave = () => {
    // delay hide a bit for nicer UX
    if (typeof window !== "undefined") {
      touchHideTimer = window.setTimeout(() => setShowArrows(false), 220);
    } else {
      setShowArrows(false);
    }
  };
  const onTouch = () => {
    setShowArrows(true);
    // auto-hide after short delay on touch devices
    if (typeof window !== "undefined") {
      if (touchHideTimer) window.clearTimeout(touchHideTimer);
      touchHideTimer = window.setTimeout(() => setShowArrows(false), 2500);
    }
  };

  const setAt = (i: number) => setIndex(Math.max(0, Math.min(i, Math.max(0, safePhotos.length - 1))));

  const isLeft = thumbnailPosition === "left";

  return (
    /* make this wrapper a hover group so children (arrows) can show only on hover */
    <div
      className={`flex ${isLeft ? "flex-row" : "flex-row-reverse"} gap-4 items-start`}
      style={flush ? { marginLeft: 0, paddingLeft: 8 } : undefined}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onTouchStart={onTouch}
    >
      {/* Thumbnail column: all visible, equal-sized, no native scrollbar */}
      {count > 0 && (
        // Outer column wrapper: allow visible overflow for the ring, but add a bit of inner padding
        // so the ring/shadow sits inside the card area and isn't visually cut at the edge.
        <div
          className="flex flex-col"
          style={{
            width: thumbWidth,
            alignItems: flush ? "flex-start" : "center",
            paddingLeft: flush ? 4 : undefined,
            overflow: "visible",
          }}
          aria-hidden={false}
        >
          {/* Inner viewport: holds the list but we compute sizes so there is no native scrollbar.
              Keep inner element height fixed; we intentionally DON'T set overflow:hidden on the outer wrapper
              so box-shadow / ring won't be clipped. */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: thumbnailGap,
              alignItems: "center",
              justifyContent: "flex-start",
              paddingTop: 6,
              paddingBottom: 6,
              height: containerHeight,
              boxSizing: "border-box",
              // small inset so outer ring has space and is not flush to container edge
              paddingLeft: 2,
              paddingRight: 2,
            }}
          >
            {safePhotos.map((p, i) => (
              <button
                key={i}
                type="button"
                data-thumb-index={i}
                onClick={() => setAt(i)}
                aria-label={`View photo ${i + 1}`}
                className={`rounded-md overflow-hidden transition-shadow focus:outline-none flex items-center justify-center ${i === index ? "" : "bg-white"}`}
                style={{
                  width: thumbWidth,
                  height: thumbHeight,
                  flex: `0 0 ${thumbHeight}px`,
                  padding: 0,
                  zIndex: i === index ? 20 : 10,
                  position: "relative",
                  // ensure the button clips its inner image corners
                  overflow: "hidden",
                  borderRadius: 10,
                }}
              >
                {/* render image as a contained element with explicit size so Next/Image doesn't stretch */}
                <Image
                  src={p}
                  alt={`thumb-${i}`}
                  width={thumbWidth}
                  height={thumbHeight}
                  className="object-cover"
                  style={{ display: "block", borderRadius: 8 }}
                />
                {/* selected contour: solid blue border + subtle shadow that stays inside visual area */}
                {i === index && (
                  <span
                    aria-hidden
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: 10,
                      boxShadow: "0 6px 14px rgba(37,99,235,0.12)",
                      border: "2px solid #B8071C",
                      pointerEvents: "none",
                      zIndex: 30,
                      transform: "translateZ(0)",
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main image area */}
      <div className="relative rounded-lg overflow-hidden bg-gray-100 flex-1 group" style={{ minHeight: containerHeight }}>
        {count > 0 ? (
          <>
            <div className="relative w-full" style={{ height: containerHeight }}>
              <Image
                src={safePhotos[index]}
                alt={`${alt} ${index + 1}`}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 600px, 900px"
                onError={(e: any) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
            </div>

            {/* Countdown overlay shown on top of the image */}
            {(startDate || endDate) && (
              // moved countdown to bottom-left of the main image
              <div className="absolute left-3 bottom-3 z-40">
                <Countdown
                  startDate={startDate ?? null}
                  endDate={endDate ?? null}
                  serverOffsetMs={typeof serverOffsetMs === "number" ? serverOffsetMs : 0}
                  className="card-countdown-overlay"
                />
              </div>
            )}

            {/* Overlay arrows for browsing (shown when showArrows=true) */}
            {/* Left (neutral style) */}
            <button
              type="button"
              aria-label="Previous image"
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-30 transition-opacity duration-150 flex items-center justify-center"
              style={{
                opacity: showArrows ? 1 : 0,
                pointerEvents: showArrows ? "auto" : "none",
              }}
            >
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center border border-gray-200 bg-white/90 shadow-sm"
                style={{ transform: "translateZ(0)", backfaceVisibility: "hidden" }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M15 6l-6 6 6 6" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>

            {/* Right (filled, neutral) */}
            <button
              type="button"
              aria-label="Next image"
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-30 transition-opacity duration-150 flex items-center justify-center"
              style={{
                opacity: showArrows ? 1 : 0,
                pointerEvents: showArrows ? "auto" : "none",
              }}
            >
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-md ring-0"
                style={{ transform: "translateZ(0)", backfaceVisibility: "hidden" }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M9 18l6-6-6-6" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
          </>
        ) : (
          <div className="w-full h-72 flex items-center justify-center text-gray-400">No image</div>
        )}
      </div>
    </div>
  );
}
