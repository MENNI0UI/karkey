/**
 * Chat Bubble Component
 * 
 * Premium floating chat with elegant, professional design.
 * Clean and sophisticated - no childish elements.
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, ChevronRight, RefreshCw, Zap, Car, MapPin, Fuel, Calendar, Maximize2, Minimize2, Gauge, Cog, ExternalLink, Sparkles, TrendingUp, Clock, Shield } from 'lucide-react';
import { useKarkeyChat, type ChatMessage, type ChatVehicle } from '@/hooks/use-karkey-chat';
import { useTranslation } from '@/lib/i18n-context';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ChatBubbleProps {
    onSearchIntent?: (filters: Record<string, any>) => void;
}

// Elegant typing indicator
function TypingIndicator() {
    return (
        <div className="flex items-center gap-1.5 px-4 py-3">
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-site-primary"
                    animate={{
                        opacity: [0.3, 1, 0.3],
                        scale: [0.8, 1, 0.8]
                    }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeInOut"
                    }}
                />
            ))}
        </div>
    );
}

// Vehicle card component for search results - Clean organized design
function VehicleCard({ vehicle, language, isLarge = false }: { vehicle: ChatVehicle; language: string; isLarge?: boolean }) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat(language === 'ar' ? 'ar-MA' : 'fr-MA', {
            style: 'decimal',
            maximumFractionDigits: 0
        }).format(price) + ' DH';
    };

    const formatMileage = (mileage: number) => {
        return new Intl.NumberFormat(language === 'ar' ? 'ar-MA' : 'fr-MA', {
            style: 'decimal',
            maximumFractionDigits: 0
        }).format(mileage) + ' km';
    };

    // Get condition label and color
    const getConditionInfo = (condition: string) => {
        const conditionMap: Record<string, { label: string; color: string; bg: string }> = {
            'excellent': { label: language === 'ar' ? 'ممتازة' : 'Excellent', color: 'text-emerald-600', bg: 'bg-emerald-50' },
            'good': { label: language === 'ar' ? 'جيدة' : 'Good', color: 'text-blue-600', bg: 'bg-blue-50' },
            'fair': { label: language === 'ar' ? 'مقبولة' : 'Fair', color: 'text-amber-600', bg: 'bg-amber-50' },
            'poor': { label: language === 'ar' ? 'ضعيفة' : 'Poor', color: 'text-red-600', bg: 'bg-red-50' },
        };
        return conditionMap[condition?.toLowerCase()] || { label: condition || '-', color: 'text-gray-600', bg: 'bg-gray-50' };
    };

    const conditionInfo = getConditionInfo(vehicle.condition);

    return (
        <Link href={vehicle.url} target="_blank">
            <motion.div
                className={cn(
                    "bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-site-primary/30 transition-all duration-300 cursor-pointer group h-full flex flex-col",
                    isLarge && "rounded-2xl"
                )}
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
            >
                {/* Vehicle Image */}
                <div className={cn(
                    "relative bg-gray-100 overflow-hidden flex-shrink-0",
                    isLarge ? "h-40" : "h-24"
                )}>
                    {vehicle.photo ? (
                        <img
                            src={vehicle.photo}
                            alt={`${vehicle.make} ${vehicle.model}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50">
                            <Car className={cn("text-gray-300", isLarge ? "w-12 h-12" : "w-8 h-8")} />
                        </div>
                    )}
                    {/* Price badge */}
                    <div className={cn(
                        "absolute bottom-2 right-2 bg-site-primary text-white font-bold rounded-lg shadow-lg",
                        isLarge ? "px-3 py-1.5 text-sm" : "px-2 py-1 text-xs"
                    )}>
                        {formatPrice(vehicle.price)}
                    </div>
                    {/* Condition badge */}
                    {vehicle.condition && (
                        <div className={cn(
                            "absolute top-2 left-2 rounded-md font-medium flex items-center gap-1",
                            conditionInfo.bg, conditionInfo.color,
                            isLarge ? "px-2 py-1 text-xs" : "px-1.5 py-0.5 text-[10px]"
                        )}>
                            <Shield className={cn(isLarge ? "w-3 h-3" : "w-2.5 h-2.5")} />
                            {conditionInfo.label}
                        </div>
                    )}
                </div>

                {/* Vehicle Info - Organized layout */}
                <div className={cn("p-2.5 flex-1 flex flex-col", isLarge && "p-3")}>
                    {/* Title */}
                    <h4 className={cn(
                        "font-bold text-gray-900 truncate",
                        isLarge ? "text-base" : "text-sm"
                    )}>
                        {vehicle.make} {vehicle.model}
                    </h4>

                    {/* Year & Location - Row 1 */}
                    <div className={cn(
                        "flex items-center gap-3 mt-1.5 text-gray-500",
                        isLarge ? "text-sm mt-2" : "text-[11px]"
                    )}>
                        <span className="flex items-center gap-1">
                            <Calendar className={cn(isLarge ? "w-3.5 h-3.5" : "w-3 h-3")} />
                            {vehicle.year}
                        </span>
                        <span className="flex items-center gap-1 truncate">
                            <MapPin className={cn(isLarge ? "w-3.5 h-3.5" : "w-3 h-3")} />
                            {vehicle.location}
                        </span>
                    </div>

                    {/* Mileage & Transmission - Row 2 */}
                    <div className={cn(
                        "flex items-center gap-3 mt-1 text-gray-400",
                        isLarge ? "text-sm mt-1.5" : "text-[11px]"
                    )}>
                        {vehicle.mileage !== undefined && (
                            <span className="flex items-center gap-1">
                                <Gauge className={cn(isLarge ? "w-3.5 h-3.5" : "w-3 h-3")} />
                                {formatMileage(vehicle.mileage)}
                            </span>
                        )}
                        {vehicle.transmission && (
                            <span className="flex items-center gap-1">
                                <Cog className={cn(isLarge ? "w-3.5 h-3.5" : "w-3 h-3")} />
                                {vehicle.transmission}
                            </span>
                        )}
                    </div>

                    {/* Fuel Type & Engine - Row 3 */}
                    <div className={cn(
                        "flex items-center gap-3 mt-1 text-gray-400",
                        isLarge ? "text-sm mt-1.5" : "text-[11px]"
                    )}>
                        <span className="flex items-center gap-1">
                            <Fuel className={cn(isLarge ? "w-3.5 h-3.5" : "w-3 h-3")} />
                            {vehicle.fuel_type}
                        </span>
                        {vehicle.engine_size && (
                            <span className="flex items-center gap-1">
                                ⚙️ {vehicle.engine_size}L
                            </span>
                        )}
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}

// Vehicle results grid - Enhanced responsive layout
function VehicleResults({ vehicles, language, isFullscreen = false }: { vehicles: ChatVehicle[]; language: string; isFullscreen?: boolean }) {
    if (!vehicles || vehicles.length === 0) return null;

    const displayCount = isFullscreen ? 24 : 8;
    const displayVehicles = vehicles.slice(0, displayCount);

    return (
        <div className="mt-3">
            {/* Results header in fullscreen */}
            {isFullscreen && vehicles.length > 0 && (
                <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-2 text-base text-gray-600">
                        <TrendingUp className="w-5 h-5 text-site-primary" />
                        <span className="font-medium">{vehicles.length} cars found</span>
                    </div>
                </div>
            )}

            <motion.div
                className={cn(
                    "gap-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent",
                    isFullscreen
                        ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 max-h-[calc(100vh-320px)] p-2"
                        : "grid grid-cols-2 max-h-[300px] pr-1"
                )}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                {displayVehicles.map((vehicle, index) => (
                    <motion.div
                        key={vehicle.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03, duration: 0.3 }}
                    >
                        <VehicleCard
                            vehicle={vehicle}
                            language={language}
                            isLarge={isFullscreen}
                        />
                    </motion.div>
                ))}
            </motion.div>

            {/* Show more indicator */}
            {vehicles.length > displayCount && (
                <div className="text-center mt-3 text-xs text-gray-400">
                    +{vehicles.length - displayCount} more cars available
                </div>
            )}
        </div>
    );
}

// Quick search suggestions component
function QuickSuggestions({ onSelect, language, isFullscreen = false }: { onSelect: (query: string) => void; language: string; isFullscreen?: boolean }) {
    const suggestions = [
        { icon: Car, label: language === 'ar' ? 'تويوتا' : 'Toyota', query: 'Toyota cars' },
        { icon: TrendingUp, label: language === 'ar' ? 'أقل من 200k' : 'Under 200k', query: 'cars under 200000' },
        { icon: Sparkles, label: language === 'ar' ? 'سيارات 2023' : '2023 Models', query: 'cars 2023' },
        { icon: Fuel, label: language === 'ar' ? 'ديزل' : 'Diesel', query: 'diesel cars' },
        { icon: MapPin, label: language === 'ar' ? 'كازابلانكا' : 'Casablanca', query: 'cars in Casablanca' },
        { icon: Cog, label: language === 'ar' ? 'أوتوماتيك' : 'Automatic', query: 'automatic cars' },
    ];

    return (
        <div className={cn(
            "flex flex-wrap gap-2",
            isFullscreen ? "justify-center gap-3 mt-6" : "mt-3"
        )}>
            {suggestions.map((sug, i) => (
                <motion.button
                    key={i}
                    onClick={() => onSelect(sug.query)}
                    className={cn(
                        "flex items-center gap-2 bg-white border border-gray-200 rounded-full hover:border-site-primary hover:bg-site-primary/5 transition-colors text-gray-600 hover:text-site-primary",
                        isFullscreen
                            ? "px-5 py-3 text-base gap-2.5"
                            : "px-2.5 py-1.5 text-xs gap-1.5"
                    )}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                >
                    <sug.icon className={cn(isFullscreen ? "w-5 h-5" : "w-3 h-3")} />
                    {sug.label}
                </motion.button>
            ))}
        </div>
    );
}

export function ChatBubble({ onSearchIntent }: ChatBubbleProps) {
    const { t, dir, language } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const {
        messages,
        input,
        handleInputChange,
        handleSubmit,
        isLoading,
        error,
        clearChat,
        askAboutAuctions,
        askAboutSelling,
        sendMessage,
    } = useKarkeyChat({ onSearchIntent });

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when opened (only on desktop to avoid mobile keyboard popup)
    useEffect(() => {
        if (isOpen && window.innerWidth >= 640) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Lock body scroll on mobile when chat is open
    useEffect(() => {
        if (isOpen && window.innerWidth < 640) {
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.body.style.top = `-${window.scrollY}px`;
        } else {
            const scrollY = document.body.style.top;
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.top = '';
            if (scrollY) {
                window.scrollTo(0, parseInt(scrollY || '0') * -1);
            }
        }

        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.top = '';
        };
    }, [isOpen]);

    const toggleChat = () => {
        if (!isOpen) {
            setIsFullscreen(false); // Reset fullscreen when opening
            setShowSuggestions(true); // Reset suggestions
        }
        setIsOpen(!isOpen);
    };

    const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

    // Handle quick suggestion selection
    const handleSuggestionSelect = (query: string) => {
        setShowSuggestions(false);
        sendMessage(query);
    };

    const quickActions = [
        {
            label: t('chat.quick_auctions'),
            onClick: askAboutAuctions,
        },
        {
            label: t('chat.quick_sell'),
            onClick: askAboutSelling,
        },
    ];

    // Track last search result to avoid repeated 'no cars available' messages
    const [lastNoCars, setLastNoCars] = useState(false);
    useEffect(() => {
        const lastMsg = messages.length > 0 ? messages[messages.length - 1] : undefined;
        if (lastMsg && Array.isArray(lastMsg.vehicles) && lastMsg.vehicles.length === 0) {
            if (!lastNoCars) setLastNoCars(true);
        } else {
            setLastNoCars(false);
        }
    }, [messages]);

    return (
        <>
            {/* Premium Chat Button */}
            <div className={cn(
                "fixed z-50",
                "bottom-4 sm:bottom-6",
                dir === 'rtl' ? 'left-4 sm:left-6' : 'right-4 sm:right-6'
            )}>
                <motion.button
                    onClick={toggleChat}
                    onHoverStart={() => setIsHovered(true)}
                    onHoverEnd={() => setIsHovered(false)}
                    className={cn(
                        "relative flex items-center justify-center",
                        "w-14 h-14 sm:w-16 sm:h-16 rounded-full",
                        "bg-site-primary",
                        "shadow-lg shadow-site-primary/30",
                        "hover:bg-[#a00618] hover:shadow-xl hover:shadow-site-primary/40",
                        "transition-all duration-300"
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.92 }}
                    aria-label={isOpen ? t('chat.close') : t('chat.open')}
                >
                    <AnimatePresence mode="wait">
                        {isOpen ? (
                            <motion.div
                                key="close"
                                initial={{ rotate: -180, opacity: 0, scale: 0 }}
                                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                                exit={{ rotate: 180, opacity: 0, scale: 0 }}
                                transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
                            >
                                <X className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="chat"
                                initial={{ rotate: 180, opacity: 0, scale: 0 }}
                                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                                exit={{ rotate: -180, opacity: 0, scale: 0 }}
                                transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
                            >
                                <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.button>

                {/* Hover label - hidden on mobile */}
                <AnimatePresence>
                    {isHovered && !isOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.15 }}
                            className={cn(
                                "hidden sm:block",
                                "absolute top-1/2 -translate-y-1/2",
                                "px-3 py-1.5 rounded-lg",
                                "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-xs font-medium",
                                "shadow-lg border border-gray-100 dark:border-gray-700",
                                "whitespace-nowrap",
                                dir === 'rtl' ? 'right-[72px]' : 'left-auto right-[72px]'
                            )}
                        >
                            {t('chat.open')}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 50 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                            mass: 0.8
                        }}
                        className={cn(
                            "fixed z-[100010]",
                            // Mobile: always full screen
                            // Desktop: normal or fullscreen mode
                            isFullscreen ? [
                                // Fullscreen mode - fill entire viewport
                                "inset-0",
                                "w-full h-full",
                                "max-h-none max-w-none",
                                "rounded-none",
                            ] : [
                                // Normal mode
                                "bottom-0 sm:bottom-28",
                                "left-0 right-0 sm:left-auto sm:right-6",
                                "w-full sm:w-[420px]",
                                "h-[100dvh] sm:h-[620px]",
                                "max-h-none sm:max-h-[700px]",
                                "rounded-none sm:rounded-2xl",
                            ],
                            "overflow-hidden",
                            "flex flex-col",
                            "bg-white",
                            "shadow-2xl",
                            "border-0 sm:border sm:border-gray-100",
                            isFullscreen && "sm:rounded-none sm:border-0"
                        )}
                        dir={dir}
                    >
                        {/* Header */}
                        <div className="relative px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-site-primary via-[#8B0516] to-site-blue">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5 sm:gap-3">
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                                        <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white text-sm sm:text-base">
                                            {t('chat.title')}
                                        </h3>
                                        <p className="text-white/70 text-[10px] sm:text-xs flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-site-accent" />
                                            {t('chat.online')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={clearChat}
                                        className="p-2 hover:bg-white/15 rounded-lg transition-colors"
                                        title={t('chat.clear')}
                                    >
                                        <RefreshCw className="w-4 h-4 text-white/80" />
                                    </button>
                                    {/* Fullscreen toggle - hidden on mobile (already fullscreen) */}
                                    <button
                                        onClick={toggleFullscreen}
                                        className="hidden sm:flex p-2 hover:bg-white/15 rounded-lg transition-colors"
                                        title={isFullscreen ? t('chat.minimize') : t('chat.maximize')}
                                    >
                                        {isFullscreen ? (
                                            <Minimize2 className="w-4 h-4 text-white/80" />
                                        ) : (
                                            <Maximize2 className="w-4 h-4 text-white/80" />
                                        )}
                                    </button>
                                    <button
                                        onClick={toggleChat}
                                        className="p-2 hover:bg-white/15 rounded-lg transition-colors"
                                        title={t('chat.close')}
                                    >
                                        <X className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className={cn(
                            "flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white",
                            isFullscreen ? "p-6 sm:p-8 space-y-5" : "p-4 space-y-3"
                        )}>
                            {messages.length === 0 ? (
                                <motion.div
                                    className={cn(
                                        "text-center px-4",
                                        isFullscreen ? "py-12" : "py-8"
                                    )}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <motion.div
                                        className={cn(
                                            "mx-auto mb-4 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-gray-100",
                                            isFullscreen ? "w-20 h-20 mb-6" : "w-14 h-14"
                                        )}
                                        animate={{ y: [0, -4, 0] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                        <MessageCircle className={cn(
                                            "text-site-primary",
                                            isFullscreen ? "w-10 h-10" : "w-7 h-7"
                                        )} />
                                    </motion.div>

                                    <h4 className={cn(
                                        "text-gray-900 font-semibold mb-1.5",
                                        isFullscreen ? "text-xl mb-3" : "text-base"
                                    )}>
                                        {t('chat.welcome_title')}
                                    </h4>
                                    <p className={cn(
                                        "text-gray-500 leading-relaxed mx-auto",
                                        isFullscreen ? "text-base mb-8 max-w-[400px]" : "text-sm mb-5 max-w-[260px]"
                                    )}>
                                        {t('chat.welcome')}
                                    </p>

                                    {/* Quick Actions */}
                                    <div className={cn(
                                        "flex flex-col mx-auto",
                                        isFullscreen ? "max-w-[400px] gap-4" : "max-w-[240px] gap-2.5"
                                    )}>
                                        {quickActions.map((action, i) => (
                                            <motion.button
                                                key={i}
                                                onClick={action.onClick}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.15 + i * 0.08 }}
                                                whileHover={{ x: dir === 'rtl' ? -4 : 4 }}
                                                className={cn(
                                                    "flex items-center justify-between w-full",
                                                    "bg-white text-gray-600",
                                                    "rounded-xl border border-gray-100",
                                                    "hover:border-site-primary/40 hover:bg-site-primary/[0.02] hover:text-gray-900",
                                                    "shadow-sm hover:shadow",
                                                    "transition-all duration-200",
                                                    "group",
                                                    isFullscreen ? "px-6 py-4 text-base" : "px-4 py-3 text-sm"
                                                )}
                                            >
                                                <span>{action.label}</span>
                                                <ChevronRight className={cn(
                                                    "text-gray-300 group-hover:text-site-primary/60 transition-all",
                                                    isFullscreen ? "w-5 h-5" : "w-4 h-4",
                                                    dir === 'rtl' ? 'rotate-180' : ''
                                                )} />
                                            </motion.button>
                                        ))}
                                    </div>

                                    {/* Quick search suggestions */}
                                    <div className={cn("mt-6", isFullscreen && "mt-10")}>
                                        <p className={cn(
                                            "text-gray-400 text-center mb-2 flex items-center justify-center gap-1.5",
                                            isFullscreen ? "text-base mb-4" : "text-xs"
                                        )}>
                                            <Sparkles className={cn(isFullscreen ? "w-5 h-5" : "w-3.5 h-3.5")} />
                                            {language === 'ar' ? 'بحث سريع' : 'Quick search'}
                                        </p>
                                        <QuickSuggestions onSelect={handleSuggestionSelect} language={language} isFullscreen={isFullscreen} />
                                    </div>
                                </motion.div>
                            ) : (
                                <>
                                    {messages.map((message: ChatMessage, idx) => (
                                        <motion.div
                                            key={message.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className={cn(
                                                "flex flex-col",
                                                message.role === 'user' ? 'items-end' : 'items-start'
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "leading-relaxed",
                                                    isFullscreen
                                                        ? "max-w-[70%] px-6 py-4 text-base"
                                                        : "max-w-[85%] px-4 py-2.5 text-sm",
                                                    message.role === 'user'
                                                        ? "bg-gradient-to-br from-site-primary to-site-blue text-white rounded-2xl rounded-br-sm"
                                                        : "bg-white text-gray-800 rounded-2xl rounded-bl-sm border border-gray-200"
                                                )}
                                            >
                                                <p className="whitespace-pre-wrap">{message.content}</p>
                                            </div>
                                            {/* Vehicle Results or No Cars Message */}
                                            {message.vehicles && message.vehicles.length > 0 && (
                                                <div className={cn(
                                                    "mt-3",
                                                    isFullscreen ? "w-full px-4" : "w-full max-w-[95%]"
                                                )}>
                                                    <VehicleResults vehicles={message.vehicles} language={language} isFullscreen={isFullscreen} />
                                                </div>
                                            )}
                                            {message.vehicles && message.vehicles.length === 0 && !lastNoCars && idx === messages.length - 1 && (
                                                <div className={cn(
                                                    "mt-3 text-center bg-white border border-gray-100 rounded-xl p-4 text-gray-600 flex flex-col items-center",
                                                    isFullscreen ? "text-base" : "text-sm"
                                                )}>
                                                    <span className="text-2xl mb-2">🤔</span>
                                                    {language === 'ar' ? 'لا توجد سيارات متاحة حالياً. تابع الموقع للمزيد!' : 'Hmm, no cars available at the moment. Good news though – our inventory updates frequently!'}
                                                    <div className="mt-2">
                                                        <a href="https://karkey.ma/en/direct-sales" target="_blank" className="text-site-primary underline">{language === 'ar' ? 'عرض السيارات المتاحة' : 'Check available cars'}</a>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                    {/* Show suggestions after messages too */}
                                    {showSuggestions && messages.length > 0 && messages.length < 3 && (
                                        <motion.div
                                            className={cn("py-2", isFullscreen && "py-4")}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.3 }}
                                        >
                                            <p className={cn(
                                                "text-gray-400 mb-2 flex items-center gap-1.5",
                                                isFullscreen ? "text-base mb-3 justify-center" : "text-xs"
                                            )}>
                                                <Sparkles className={cn(isFullscreen ? "w-5 h-5" : "w-3.5 h-3.5")} />
                                                {language === 'ar' ? 'جرب أيضاً' : 'Try also'}
                                            </p>
                                            <QuickSuggestions onSelect={handleSuggestionSelect} language={language} isFullscreen={isFullscreen} />
                                        </motion.div>
                                    )}
                                </>
                            )}
                            {/* Loading */}
                            {isLoading && (
                                <motion.div
                                    className="flex justify-start"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <div className="bg-white rounded-2xl rounded-bl-sm border border-gray-200">
                                        <TypingIndicator />
                                    </div>
                                </motion.div>
                            )}
                            {/* Error */}
                            {error && (
                                <div className="text-center py-2">
                                    <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg inline-block">
                                        {t('chat.error')}
                                    </p>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form
                            onSubmit={handleSubmit}
                            className={cn(
                                "border-t border-gray-100 bg-white",
                                isFullscreen ? "p-6 sm:p-8" : "p-4"
                            )}
                            data-chat-form
                        >
                            <div className={cn(
                                "flex items-center gap-3",
                                isFullscreen && "max-w-3xl mx-auto"
                            )}>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={handleInputChange}
                                    placeholder={t('chat.placeholder')}
                                    disabled={isLoading}
                                    className={cn(
                                        "flex-1 rounded-xl",
                                        "bg-gray-50",
                                        "border border-gray-100",
                                        "focus:border-site-primary/50 focus:bg-white focus:ring-2 focus:ring-site-primary/10",
                                        "placeholder-gray-400",
                                        "disabled:opacity-50",
                                        "transition-all duration-200",
                                        isFullscreen ? "px-6 py-4 text-base rounded-2xl" : "px-4 py-2.5 text-sm"
                                    )}
                                    dir="auto"
                                />
                                <motion.button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    data-chat-submit
                                    className={cn(
                                        "rounded-xl",
                                        "bg-gradient-to-r from-site-primary to-site-blue",
                                        "text-white",
                                        "shadow-sm hover:shadow-md",
                                        "transition-all duration-200",
                                        "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-sm",
                                        isFullscreen ? "p-4 rounded-2xl" : "p-2.5"
                                    )}
                                >
                                    <Send className={cn(
                                        isFullscreen ? "w-5 h-5" : "w-4 h-4",
                                        dir === 'rtl' && "rotate-180"
                                    )} />
                                </motion.button>
                            </div>

                            <p className={cn(
                                "text-center text-gray-400 tracking-wide",
                                isFullscreen ? "text-sm mt-4" : "text-[11px] mt-2.5"
                            )}>
                                Powered by <span className="font-medium text-site-primary">Karkey</span>
                            </p>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
