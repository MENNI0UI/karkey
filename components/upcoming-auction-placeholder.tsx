"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { m } from "framer-motion"
import { Bell, Star, Sparkles, Plus, Mail, Loader2, CheckCircle, BellOff } from "lucide-react"
import { useTranslation } from "@/lib/i18n-context"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function UpcomingAuctionsPlaceholder() {
    const { t, language } = useTranslation()
    const { toast } = useToast()
    const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number }>({ d: 0, h: 0, m: 0, s: 0 })
    const [isReminderOpen, setIsReminderOpen] = useState(false)
    const [isSubscribed, setIsSubscribed] = useState(false)

    const [isSuccessOpen, setIsSuccessOpen] = useState(false)
    const [isAlreadySubscribedOpen, setIsAlreadySubscribedOpen] = useState(false)
    const [subscribedEmail, setSubscribedEmail] = useState("")
    const [guestEmail, setGuestEmail] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [emailError, setEmailError] = useState("")

    // Check for existing auth session to auto-fill email or auto-subscribe
    const getCachedUser = () => {
        if (typeof window === "undefined") return null
        try {
            const cached = localStorage.getItem("me_cached")
            if (cached) return JSON.parse(cached)
        } catch { }
        return null
    }

    // Save pending reminder intent to sessionStorage
    const setPendingReminder = () => {
        if (typeof window !== "undefined") {
            sessionStorage.setItem("pendingAuctionReminder", "true")
        }
    }

    // Check and clear pending reminder
    const checkPendingReminder = () => {
        if (typeof window === "undefined") return false
        const pending = sessionStorage.getItem("pendingAuctionReminder")
        if (pending) {
            sessionStorage.removeItem("pendingAuctionReminder")
            return true
        }
        return false
    }

    const handleRemindMe = async () => {
        const user = getCachedUser()?.user
        if (user?.email) {
            // Logged in user: Auto-subscribe
            await subscribeToReminder(user.email, user.id)
        } else {
            // Guest: Open dialog with email input
            setGuestEmail("")
            setEmailError("")
            setIsReminderOpen(true)
        }
    }

    // Handle login button click - save intent before redirect
    const handleLoginClick = () => {
        setPendingReminder()
        setIsReminderOpen(false)
    }

    // Validate email format
    const validateEmail = (email: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return regex.test(email)
    }

    // Handle guest email submission
    const handleGuestSubscribe = async () => {
        if (!guestEmail.trim()) {
            setEmailError(t('auctions.upcoming.guest_dialog.email_required') || "Email is required")
            return
        }
        if (!validateEmail(guestEmail)) {
            setEmailError(t('auctions.upcoming.guest_dialog.email_invalid') || "Invalid email address")
            return
        }
        setEmailError("")
        await subscribeToReminder(guestEmail)
        setIsReminderOpen(false)
    }

    const subscribeToReminder = async (email: string, userId?: number) => {
        if (!email) return

        setIsSubmitting(true)
        try {
            const res = await fetch("/api/reminders/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, userId, language }),
            })

            const data = await res.json()

            if (res.ok && data.success) {
                setSubscribedEmail(email)
                if (data.alreadySubscribed) {
                    // User is already subscribed
                    setIsSubscribed(true)
                    setIsAlreadySubscribedOpen(true)
                } else {
                    // New subscription
                    setIsSubscribed(true)
                    setIsSuccessOpen(true)
                }
            } else {
                throw new Error(data.error || "Failed")
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Something went wrong. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    // Handle unsubscribe
    const handleUnsubscribe = async () => {
        if (!subscribedEmail) return

        setIsSubmitting(true)
        try {
            const token = btoa(subscribedEmail)
            const res = await fetch(`/api/reminders/unsubscribe?token=${encodeURIComponent(token)}`)
            const data = await res.json()

            if (res.ok && data.success) {
                setIsAlreadySubscribedOpen(false)
                setIsSubscribed(false)
                toast({
                    title: t('auctions.upcoming.unsubscribed_title') || "Unsubscribed",
                    description: t('auctions.upcoming.unsubscribed_desc') || "You have been unsubscribed from auction reminders.",
                })
            } else {
                throw new Error("Failed")
            }
        } catch {
            toast({
                title: "Error",
                description: "Failed to unsubscribe. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    // Check for pending reminder on mount (after returning from login)
    useEffect(() => {
        const user = getCachedUser()?.user
        if (user?.email) {
            if (checkPendingReminder()) {
                // User just logged in and had pending reminder intent
                subscribeToReminder(user.email, user.id)
            } else {
                // Just check status
                checkSubscriptionStatus(user.email)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const checkSubscriptionStatus = async (email: string) => {
        try {
            const res = await fetch(`/api/reminders/status?email=${encodeURIComponent(email)}`)
            const data = await res.json()
            if (data.success && data.isSubscribed) {
                setIsSubscribed(true)
                setSubscribedEmail(email)
            }
        } catch { }
    }

    useEffect(() => {
        // Calculate next Saturday 00:00
        const calculateTimeLeft = () => {
            const now = new Date()
            const nextSaturday = new Date()
            const day = now.getDay()
            const daysUntilSat = (6 - day + 7) % 7
            nextSaturday.setDate(now.getDate() + daysUntilSat)
            nextSaturday.setHours(0, 0, 0, 0)
            if (nextSaturday.getTime() <= now.getTime()) {
                nextSaturday.setDate(nextSaturday.getDate() + 7)
            }
            const diff = nextSaturday.getTime() - now.getTime()
            if (diff > 0) {
                setTimeLeft({
                    d: Math.floor(diff / (1000 * 60 * 60 * 24)),
                    h: Math.floor((diff / (1000 * 60 * 60)) % 24),
                    m: Math.floor((diff / 1000 / 60) % 60),
                    s: Math.floor((diff / 1000) % 60),
                })
            }
        }
        calculateTimeLeft()
        const timer = setInterval(calculateTimeLeft, 1000)
        return () => clearInterval(timer)
    }, [])

    return (
        <div className="relative w-full min-h-[calc(100vh-var(--site-header-height,76px))] flex items-center justify-center overflow-hidden bg-white">

            <div className="relative z-10 container mx-auto px-4 text-center">

                {/* Premium Badge */}
                <m.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-gradient-to-r from-[#00A651] to-[#00C853] text-white shadow-lg mb-10 group cursor-default hover:scale-105 transition-all duration-300"
                >
                    <Sparkles className="w-4 h-4 text-white fill-white" />
                    <span className="text-sm font-semibold tracking-wide uppercase">{t('auctions.placeholder.premium_badge')}</span>
                </m.div>

                {/* Editorial Title */}
                <m.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-5xl md:text-7xl font-serif mb-6 tracking-tight leading-none"
                >
                    <span className="bg-gradient-to-br from-[#00A651] to-[#004D25] bg-clip-text text-transparent drop-shadow-sm">
                        {t('auctions.placeholder.hero_title_prefix')}
                    </span>{' '}
                    <span className="text-[#B8071C] italic inline-block relative">
                        {t('auctions.placeholder.hero_title_suffix')}
                        <m.span
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ delay: 1, duration: 0.8 }}
                            className="absolute -bottom-2 left-0 h-[2px] bg-gradient-to-r from-transparent via-[#B8071C] to-transparent"
                        />
                    </span>
                </m.h1>
                <m.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-14 font-light leading-relaxed"
                >
                    {t('auctions.placeholder.hero_subtitle')}
                </m.p>

                {/* Elegant Countdown */}
                <m.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-wrap justify-center gap-8 md:gap-12 mb-16"
                >
                    <CountdownUnit value={timeLeft.d} label={t('auctions.placeholder.unit.days')} />
                    <div className="hidden md:block text-4xl font-serif text-slate-200 self-start mt-2">:</div>
                    <CountdownUnit value={timeLeft.h} label={t('auctions.placeholder.unit.hours')} />
                    <div className="hidden md:block text-4xl font-serif text-slate-200 self-start mt-2">:</div>
                    <CountdownUnit value={timeLeft.m} label={t('auctions.placeholder.unit.minutes')} />
                    <div className="hidden md:block text-4xl font-serif text-slate-200 self-start mt-2">:</div>
                    <CountdownUnit value={timeLeft.s} label={t('auctions.placeholder.unit.seconds')} />
                </m.div>

                {/* Ultra Luxury Actions */}
                <m.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8"
                >
                    <Link href="/direct-sales/create" className="w-full sm:w-auto">
                        <m.button
                            whileHover={{ scale: 1.02, translateY: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="group relative w-full sm:min-w-[300px] px-10 py-3.5 sm:py-4.5 bg-gradient-to-r from-[#B8071C] to-[#E53935] text-white rounded-2xl overflow-hidden shadow-2xl shadow-red-950/30 transition-shadow duration-300"
                        >
                            {/* Shiny Gloss Overlay */}
                            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />

                            {/* White Shine Effect on Hover */}
                            <div className="absolute -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shine-slow pointer-events-none" />

                            <span className="relative flex items-center justify-center gap-4">
                                <span className="bg-white/20 p-1.5 rounded-sm backdrop-blur-lg border border-white/30 group-hover:border-white/50 transition-colors">
                                    <Plus className="w-4 h-4 text-white" />
                                </span>
                                <span className="font-serif text-xl tracking-wide text-white drop-shadow-sm">{t('auctions.placeholder.list_your_vehicle')}</span>
                            </span>
                        </m.button>
                    </Link>

                    {/* Remind Me Button */}
                    <m.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={isSubscribed ? () => setIsAlreadySubscribedOpen(true) : handleRemindMe}
                        disabled={isSubmitting}
                        className={`group relative px-10 py-3.5 sm:py-4.5 flex items-center justify-center gap-4 transition-all duration-300 rounded-2xl border bg-white sm:min-w-[240px] relative overflow-hidden shadow-sm hover:shadow-md disabled:opacity-50
                            ${isSubscribed
                                ? 'text-green-600 border-green-200 hover:border-green-500 hover:bg-green-50'
                                : 'text-[#00A651] border-slate-200 hover:text-[#B8071C] hover:border-[#B8071C]'
                            }`}
                    >
                        {/* Red Accent Line for non-subscribed */}
                        {!isSubscribed && (
                            <div className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#B8071C] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center" />
                        )}

                        <span className="relative flex items-center gap-3">
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span className={`font-serif text-xl tracking-wide transition-colors duration-300 ${!isSubscribed && "group-hover:text-[#B8071C]"}`}>
                                        {isSubscribed ? (t('auctions.upcoming.reminder_set') || "Reminder Set") : t('auctions.placeholder.remind_me')}
                                    </span>
                                    {isSubscribed ? (
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    ) : (
                                        <Bell className="w-5 h-5 text-slate-400 group-hover:text-[#B8071C] group-hover:rotate-12 transition-all duration-300" />
                                    )}
                                </>
                            )}
                        </span>
                    </m.button>
                </m.div>

                {/* Guest Email Dialog */}
                <Dialog open={isReminderOpen} onOpenChange={setIsReminderOpen}>
                    <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 font-serif text-[#00A651]">
                                <Bell className="w-5 h-5 text-[#00A651]" />
                                {t('auctions.upcoming.guest_dialog.title')}
                            </DialogTitle>
                            <DialogDescription className="pt-2 text-base">
                                {t('auctions.upcoming.guest_dialog.email_desc') || "Enter your email to receive a reminder when the auction starts."}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-4">
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <Input
                                    type="email"
                                    placeholder={t('auctions.upcoming.guest_dialog.email_placeholder') || "your@email.com"}
                                    value={guestEmail}
                                    onChange={(e) => {
                                        setGuestEmail(e.target.value)
                                        setEmailError("")
                                    }}
                                    onKeyDown={(e) => e.key === "Enter" && handleGuestSubscribe()}
                                    className={`pl-10 h-12 text-base ${emailError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                />
                            </div>
                            {emailError && (
                                <p className="text-red-500 text-sm mt-2">{emailError}</p>
                            )}
                        </div>

                        <DialogFooter className="flex flex-col sm:flex-row gap-2">
                            <Button variant="outline" onClick={() => setIsReminderOpen(false)} className="w-full sm:w-auto">
                                {t('auctions.upcoming.guest_dialog.cta_cancel')}
                            </Button>
                            <Button
                                onClick={handleGuestSubscribe}
                                disabled={isSubmitting}
                                className="w-full sm:w-auto bg-[#00A651] hover:bg-[#008C44] text-white gap-2 rounded-xl shadow-lg"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Bell className="w-4 h-4" />
                                        {t('auctions.upcoming.guest_dialog.cta_subscribe') || "Subscribe"}
                                    </>
                                )}
                            </Button>
                        </DialogFooter>

                        <div className="text-center text-sm text-slate-400 pt-2">
                            {t('auctions.upcoming.guest_dialog.or_login') || "Or"}{" "}
                            <Link
                                href="/auth/login?callbackUrl=/auctions"
                                onClick={handleLoginClick}
                                className="text-[#00A651] hover:underline"
                            >
                                {t('auctions.upcoming.guest_dialog.login_link') || "sign in to your account"}
                            </Link>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Success Reminder Dialog */}
                <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
                    <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                {t('auctions.upcoming.success_dialog.title')}
                            </DialogTitle>
                            <DialogDescription className="pt-2 text-base">
                                {t('auctions.upcoming.success_dialog.desc', { email: subscribedEmail })}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="flex justify-center mt-4">
                            <Button onClick={() => setIsSuccessOpen(false)} className="bg-[#00A651] hover:bg-[#008C44] text-white min-w-[120px] rounded-xl shadow-md">
                                {t('auctions.upcoming.success_dialog.cta')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Already Subscribed Dialog */}
                <Dialog open={isAlreadySubscribedOpen} onOpenChange={setIsAlreadySubscribedOpen}>
                    <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-amber-500" />
                                {t('auctions.upcoming.already_subscribed.title') || "Already Subscribed"}
                            </DialogTitle>
                            <DialogDescription className="pt-2 text-base">
                                {t('auctions.upcoming.already_subscribed.desc', { email: subscribedEmail }) || `You are already subscribed with ${subscribedEmail}. You will receive a reminder when the auction starts.`}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="flex flex-col sm:flex-row justify-center gap-2 mt-4">
                            <Button onClick={() => setIsAlreadySubscribedOpen(false)} className="bg-[#00A651] hover:bg-[#008C44] text-white min-w-[120px] rounded-xl shadow-md">
                                {t('auctions.upcoming.already_subscribed.cta_ok') || "Got it"}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleUnsubscribe}
                                disabled={isSubmitting}
                                className="min-w-[120px] rounded-xl gap-2"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <BellOff className="w-4 h-4" />
                                        {t('auctions.upcoming.already_subscribed.cta_unsubscribe') || "Unsubscribe"}
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Value Proposition */}
                <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 1 }}
                    className="mt-16 md:mt-20 pt-8 pb-8 md:pt-10 md:pb-0 border-t border-slate-100 w-full max-w-4xl mx-auto"
                >
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 text-center md:text-left">
                        <PropItem text={t('auctions.placeholder.prop.simple_registration')} delay={0.9} />
                        <div className="hidden md:block w-px h-4 bg-slate-200" />
                        <PropItem text={t('auctions.placeholder.prop.secure_transactions')} delay={1} />
                        <div className="hidden md:block w-px h-4 bg-slate-200" />
                        <PropItem text={t('auctions.placeholder.prop.premium_selection')} delay={1.1} />
                    </div>
                </m.div>
            </div>
        </div>
    )
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
    return (
        <div className="flex flex-col items-center group/unit hover:scale-105 transition-transform duration-300">
            <span className="text-5xl md:text-7xl font-serif mb-2 tabular-nums notranslate bg-gradient-to-b from-[#00A651] to-[#004D25] bg-clip-text text-transparent drop-shadow-md">
                {value.toString().padStart(2, '0')}
            </span>
            <span className="text-xs font-bold text-[#B8071C] uppercase tracking-[0.2em]">{label}</span>
        </div>
    )
}

function PropItem({ text, delay }: { text: string; delay: number }) {
    return (
        <m.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.5 }}
            className="flex items-center gap-3 text-slate-500 font-medium text-sm lg:text-base uppercase tracking-wider justify-center md:justify-start"
        >
            <div className="relative">
                <Star className="w-5 h-5 text-[#B8071C] fill-[#B8071C]/10" />
            </div>
            {text}
        </m.div>
    )
}
