"use client";

import { motion, HTMLMotionProps, Variants } from "framer-motion";
import React from "react";

// ------------------------------------------------------------------
// Base Variants - Enhanced for more visible animations
// ------------------------------------------------------------------

const fadeInVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
    },
};

const slideUpVariants: Variants = {
    hidden: { opacity: 0, y: 30, scale: 0.97 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
    },
};

const slideDownVariants: Variants = {
    hidden: { opacity: 0, y: -30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
    },
};

const staggerContainerVariants: Variants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.12,
            delayChildren: 0.15,
        },
    },
};

const staggerItemVariants: Variants = {
    hidden: { opacity: 0, y: 25, scale: 0.96 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94]
        }
    },
};

export const textRevealVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.8,
            ease: [0.215, 0.61, 0.355, 1], // easeOutCubic
        },
    },
};

// ------------------------------------------------------------------
// Components
// ------------------------------------------------------------------

interface MotionWrapperProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
    delay?: number;
}

/**
 * A simple container that fades in when it enters the viewport.
 */
export function FadeIn({ children, className, delay = 0, ...props }: MotionWrapperProps) {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeInVariants}
            transition={{ delay }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
}

/**
 * A container that reveals when scrolled into view.
 */
export function Reveal({ children, className, delay = 0, ...props }: MotionWrapperProps) {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={slideUpVariants}
            transition={{ delay }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
}

/**
 * A container that slides down and fades in (e.g. from header).
 */
export function SlideDown({ children, className, delay = 0, ...props }: MotionWrapperProps) {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={slideDownVariants}
            transition={{ delay }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
}

/**
 * A container that slides up and fades in when it enters the viewport.
 * Good for Hero sections, cards, and headers.
 */
export function SlideUp({ children, className, delay = 0, ...props }: MotionWrapperProps) {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={slideUpVariants}
            transition={{ delay }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
}

/**
 * A container for lists/grids. Children of this container should use
 * StaggerItem to benefit from the stagger effect.
 */
export function StaggerContainer({ children, className, once = true, ...props }: MotionWrapperProps & { once?: boolean }) {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once, margin: "-100px" }}
            variants={staggerContainerVariants}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
}

/**
 * A wrapper item to be used INSIDE a StaggerContainer.
 * It will inherit the staggering effect.
 */
export function StaggerItem({ children, className, skipAnimation = false, ...props }: MotionWrapperProps & { skipAnimation?: boolean }) {
    if (skipAnimation) {
        return <div className={className}>{children}</div>;
    }
    return (
        <motion.div
            variants={staggerItemVariants}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
}

/**
 * A button or interactive element wrapper that adds scale and tap effects.
 */
export function ScaleButton({ children, className, whileHover, whileTap, ...props }: HTMLMotionProps<"button">) {
    return (
        <motion.button
            whileHover={whileHover || { scale: 1.05 }}
            whileTap={whileTap || { scale: 0.95 }}
            className={className}
            {...props}
        >
            {children}
        </motion.button>
    );
}

/**
 * Splits text into characters (or words for Arabic) and animates them with a stagger effect.
 */
export function SplittingText({
    text,
    className,
    delay = 0,
    stagger = 0.03,
    once = true,
}: {
    text: string;
    className?: string;
    delay?: number;
    stagger?: number;
    once?: boolean;
}) {
    // Helper to detect Arabic text
    const isArabic = /[\u0600-\u06FF]/.test(text);

    // For Arabic, we MUST split by words because splitting by characters breaks the cursive connection.
    // For non-Arabic, we split by characters for the premium staggered effect.
    const items = isArabic ? text.split(/(\s+)/) : text.split("");

    return (
        <motion.span
            initial="hidden"
            whileInView="visible"
            viewport={{ once }}
            variants={{
                visible: {
                    transition: {
                        staggerChildren: isArabic ? stagger * 3 : stagger, // Slower stagger for words
                        delayChildren: delay,
                    },
                },
            }}
            className={`inline-block ${className}`}
        >
            {items.map((item, i) => (
                <motion.span
                    key={i}
                    variants={textRevealVariants}
                    className="inline-block py-3"
                    style={{ whiteSpace: "pre" }}
                >
                    {item}
                </motion.span>
            ))}
        </motion.span>
    );
}

