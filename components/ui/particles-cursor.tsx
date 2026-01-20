"use client"

import React, { useEffect, useRef } from "react"

export default function ParticlesCursor() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const mousePosition = useRef({ x: 0, y: 0 })
    const isMoving = useRef(false)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        let animationFrameId: number
        const particles: Particle[] = []

        const resizeCanvas = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }

        window.addEventListener("resize", resizeCanvas)
        resizeCanvas()

        class Particle {
            x: number
            y: number
            size: number
            baseSize: number
            speedX: number
            speedY: number
            color: string
            opacity: number
            life: number
            maxLife: number

            constructor(x: number, y: number) {
                this.x = x
                this.y = y
                this.baseSize = Math.random() * 10 + 5
                this.size = this.baseSize
                // Smoke logic: slight horizontal drift, slightly upwards
                this.speedX = (Math.random() - 0.5) * 1.5
                this.speedY = (Math.random() - 0.5) * 1.5 - 0.5

                // Brand red variation
                const redValue = Math.floor(Math.random() * 50) + 184 // Around 184 (B8)
                this.color = `${redValue}, 7, 28` // Based on #B8071C (184, 7, 28)

                this.opacity = Math.random() * 0.4 + 0.1
                this.maxLife = Math.random() * 60 + 40
                this.life = this.maxLife
            }

            update() {
                this.x += this.speedX
                this.y += this.speedY

                // Smoke expands
                this.size += 0.2

                // Fade out
                this.life--
                this.opacity = (this.life / this.maxLife) * 0.4
            }

            draw() {
                if (!ctx) return
                ctx.beginPath()
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`
                // Add soft blur feel
                ctx.shadowBlur = this.size * 1.5
                ctx.shadowColor = `rgba(${this.color}, ${this.opacity * 0.5})`
                ctx.fill()
            }
        }

        const handleMouseMove = (e: MouseEvent) => {
            mousePosition.current = { x: e.clientX, y: e.clientY }
            isMoving.current = true

            // Create particles on move
            for (let i = 0; i < 2; i++) {
                particles.push(new Particle(e.clientX, e.clientY))
            }
        }

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches[0]) {
                mousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
                for (let i = 0; i < 2; i++) {
                    particles.push(new Particle(e.touches[0].clientX, e.touches[0].clientY))
                }
            }
        }

        window.addEventListener("mousemove", handleMouseMove)
        window.addEventListener("touchmove", handleTouchMove)

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // Update and draw particles
            for (let i = 0; i < particles.length; i++) {
                particles[i].update()
                particles[i].draw()

                // Remove dead particles
                if (particles[i].life <= 0) {
                    particles.splice(i, 1)
                    i--
                }
            }

            // Cap particle count for performance
            if (particles.length > 150) {
                particles.shift()
            }

            animationFrameId = requestAnimationFrame(animate)
        }

        animate()

        return () => {
            window.removeEventListener("resize", resizeCanvas)
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("touchmove", handleTouchMove)
            cancelAnimationFrame(animationFrameId)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[99999]"
            style={{ mixBlendMode: 'screen' }}
        />
    )
}
