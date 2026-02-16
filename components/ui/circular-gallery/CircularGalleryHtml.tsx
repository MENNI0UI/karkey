"use client";

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion';
import './CircularGalleryHtml.css';

interface CircularGalleryHtmlProps {
    items: React.ReactNode[];
}

export default function CircularGalleryHtml({ items = [] }: CircularGalleryHtmlProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [displayIndex, setDisplayIndex] = useState(Math.floor(items.length / 2));

    // Config
    const CARD_WIDTH = 320;
    const GAP = 24;
    const TOTAL_WIDTH = CARD_WIDTH + GAP;
    const CENTER_THRESHOLD = 0.4;
    const maxIndex = Math.max(0, items.length - 1);

    // Initial position
    const initialIndex = Math.floor(items.length / 2);

    // indexValue is our driven value (can be fractional during drag/animate)
    const indexValue = useMotionValue(initialIndex);

    // Sync state for display/UI purposes (only when it crosses threshold)
    useEffect(() => {
        const unsubscribe = indexValue.on("change", (latest) => {
            const rounded = Math.round(latest);
            if (rounded !== displayIndex) {
                setDisplayIndex(rounded);
            }
        });
        return () => unsubscribe();
    }, [displayIndex, indexValue]);

    // Navigation handlers
    const animateToIndex = (targetIdx: number) => {
        const clamped = Math.max(0, Math.min(maxIndex, targetIdx));
        animate(indexValue, clamped, {
            type: "spring",
            stiffness: 260,
            damping: 30,
            mass: 1,
        });
    };

    const goToPrevious = () => animateToIndex(Math.round(indexValue.get()) - 1);
    const goToNext = () => animateToIndex(Math.round(indexValue.get()) + 1);

    // Drag handlers
    const onDrag = (_: any, info: PanInfo) => {
        const current = indexValue.get();
        let delta = -info.delta.x / TOTAL_WIDTH;

        // Stronger rubber-band clamping at boundaries
        if (current < 0 && delta < 0) {
            // Dragging left past start - add high resistance
            delta *= Math.max(0.05, 1 - Math.abs(current) / 0.3);
        } else if (current > maxIndex && delta > 0) {
            // Dragging right past end - add high resistance
            delta *= Math.max(0.05, 1 - (current - maxIndex) / 0.3);
        }

        // Hard clamping: Never let it escape more than 0.8 index units
        const next = current + delta;
        const hardClamped = Math.max(-0.8, Math.min(maxIndex + 0.8, next));
        indexValue.set(hardClamped);
    };

    const onDragEnd = (_: any, info: PanInfo) => {
        const current = indexValue.get();
        // Incorporate velocity for momentum
        const velocity = -info.velocity.x / TOTAL_WIDTH;
        let target = current + velocity * 0.1; // Reduced momentum for stability

        // Clamp target strictly within valid indices
        target = Math.max(0, Math.min(maxIndex, Math.round(target)));

        animateToIndex(target);
    };

    const isAtStart = displayIndex <= 0;
    const isAtEnd = displayIndex >= maxIndex;

    return (
        <div className="gallery-wrapper" style={{ position: 'relative', width: '100%', height: '100%' }}>
            {/* Left Navigation Arrow */}
            <button
                onClick={goToPrevious}
                disabled={isAtStart}
                className="gallery-nav-arrow gallery-nav-arrow-left"
                aria-label="Previous card"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Right Navigation Arrow */}
            <button
                onClick={goToNext}
                disabled={isAtEnd}
                className="gallery-nav-arrow gallery-nav-arrow-right"
                aria-label="Next card"
            >
                <ChevronRight className="w-6 h-6" />
            </button>

            <motion.div
                ref={containerRef}
                className="circular-gallery-container"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0}
                onDrag={onDrag}
                onDragEnd={onDragEnd}
                style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'grab',
                    touchAction: 'none',
                    userSelect: 'none',
                    perspective: '1000px',
                }}
                whileTap={{ cursor: 'grabbing' }}
            >
                <div
                    className="gallery-track"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        position: 'relative',
                        transformStyle: 'preserve-3d',
                    }}
                >
                    {items.map((item, index) => (
                        <Card
                            key={`card-${index}`}
                            index={index}
                            indexValue={indexValue}
                            TOTAL_WIDTH={TOTAL_WIDTH}
                            CARD_WIDTH={CARD_WIDTH}
                            CENTER_THRESHOLD={CENTER_THRESHOLD}
                            onSelect={() => animateToIndex(index)}
                        >
                            {item}
                        </Card>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}

function Card({
    index,
    indexValue,
    TOTAL_WIDTH,
    CARD_WIDTH,
    CENTER_THRESHOLD,
    onSelect,
    children
}: {
    index: number,
    indexValue: any,
    TOTAL_WIDTH: number,
    CARD_WIDTH: number,
    CENTER_THRESHOLD: number,
    onSelect: () => void,
    children: React.ReactNode
}) {
    // These transforms run outside of React re-renders for CPU efficiency
    const x = useTransform(indexValue, (val: number) => (index - val) * TOTAL_WIDTH);
    const absOffset = useTransform(indexValue, (val: number) => Math.abs(index - val));

    const z = useTransform(absOffset, [0, 4], [0, -320]);
    const scale = useTransform(absOffset, [0, 1.5], [1, 0.75]);
    const opacity = useTransform(absOffset, [0, 3, 4], [1, 0.5, 0]);
    const rotateY = useTransform(indexValue, (val: number) => (index - val) * -3);
    const zIndex = useTransform(absOffset, (val: number) => 100 - Math.round(val * 10));

    // Visibility optimization: hide only if very far (safety net)
    const display = useTransform(absOffset, (val: number) => val > 10 ? "none" : "block");

    return (
        <motion.div
            className="gallery-card"
            style={{
                position: 'absolute',
                width: `${CARD_WIDTH}px`,
                x,
                z,
                scale,
                opacity,
                rotateY,
                zIndex,
                display,
                cursor: 'pointer',
                transformStyle: 'preserve-3d',
                pointerEvents: 'auto',
            }}
            onClick={(e) => {
                if (absOffset.get() > CENTER_THRESHOLD) {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelect();
                }
            }}
        >
            {/* Overlay for side cards to capture clicks even if content has its own handlers */}
            <motion.div
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 10,
                    display: useTransform(absOffset, (val: number) => val < CENTER_THRESHOLD ? 'none' : 'block')
                }}
            />

            <div style={{ pointerEvents: 'inherit' }}>
                {children}
            </div>
        </motion.div>
    );
}
