/**
 * Chat Hook - useKarkeyChat
 * 
 * Custom hook for managing chat state and API communication.
 * Supports AI tool calls for vehicle search.
 */

'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n-context';
import { useAuth } from '@/lib/auth-context';

export interface ChatVehicle {
    id: number;
    type: 'direct_sale' | 'auction' | 'karkey';
    make: string;
    model: string;
    year: number;
    price: number;
    mileage: number;
    location: string;
    fuel_type: string;
    transmission: string;
    condition: string;
    engine_size: string;
    photo: string | null;
    url: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    vehicles?: ChatVehicle[]; // Vehicles found by search tool
}

export interface UseKarkeyChatOptions {
    onSearchIntent?: (filters: Record<string, unknown>) => void;
}

export function useKarkeyChat(options: UseKarkeyChatOptions = {}) {
    const { language } = useTranslation();
    const { currentUserId } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Storage key varies by user to ensure privacy
    const storageKey = `karkey-chat-v1-${currentUserId || 'guest'}`;

    const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // 1. Load history on mount or when user changes
    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    setMessages(parsed);
                }
            } else {
                setMessages([]); // Reset for new user if no history
            }
        } catch (e) {
            console.error('[Chat] Failed to load history:', e);
            setMessages([]);
        } finally {
            setIsHistoryLoaded(true);
        }
    }, [storageKey]);

    // 2. Save history whenever messages change
    useEffect(() => {
        if (typeof window === 'undefined' || !isHistoryLoaded) return;

        try {
            if (messages.length > 0) {
                localStorage.setItem(storageKey, JSON.stringify(messages));
            } else {
                localStorage.removeItem(storageKey);
            }
        } catch (e) {
            console.error('[Chat] Failed to save history:', e);
        }
    }, [messages, storageKey, isHistoryLoaded]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setInput(e.target.value);
    }, []);

    // Parse stream that may contain vehicle data
    const parseStreamChunk = (text: string): { content: string; vehicles: ChatVehicle[] } => {
        let content = text;
        let vehicles: ChatVehicle[] = [];

        // Check for embedded vehicles data
        const vehiclesMatch = text.match(/__VEHICLES__(.*?)__END_VEHICLES__/s);
        if (vehiclesMatch) {
            try {
                const vehiclesData = JSON.parse(vehiclesMatch[1]);
                if (vehiclesData.type === 'vehicles' && Array.isArray(vehiclesData.data)) {
                    // VALIDATION: Only accept vehicles with valid IDs from our database
                    vehicles = vehiclesData.data.filter((v: ChatVehicle) =>
                        v.id && typeof v.id === 'number' && v.id > 0 &&
                        v.url && v.url.startsWith('/') // Must have valid internal URL
                    );
                }
            } catch {
                // Skip malformed data
            }
            // Remove vehicles marker from content
            content = text.replace(/__VEHICLES__.*?__END_VEHICLES__/s, '');
        }

        // IMPORTANT: Hide incomplete markers during streaming
        // If we see __VEHICLES__ but not __END_VEHICLES__, hide everything after __VEHICLES__
        if (content.includes('__VEHICLES__') && !content.includes('__END_VEHICLES__')) {
            content = content.substring(0, content.indexOf('__VEHICLES__'));
        }

        // Also clean up any partial markers or JSON that might be visible
        content = content
            .replace(/__VEHICLES__/g, '')
            .replace(/__END_VEHICLES__/g, '')
            .replace(/\{"type":"vehicles".*$/s, '') // Remove partial JSON at end
            .trim();

        // ANTI-HALLUCINATION: Clean content if it contains suspicious vehicle listings
        // when no valid vehicles were provided
        if (vehicles.length === 0) {
            // Check for patterns that look like hallucinated vehicle lists
            const suspiciousPatterns = [
                /\d{4}\s+(Toyota|BMW|Mercedes|Audi|Volkswagen|Renault|Peugeot|Ford|Nissan|Honda|Hyundai|Kia|Dacia)/gi,
                /(\d{2,3}[,.]?\d{3})\s*(MAD|DH|درهم)/gi,
                /^\s*\d+\.\s+(Toyota|BMW|Mercedes|Audi|Volkswagen)/gim,
            ];

            for (const pattern of suspiciousPatterns) {
                if (pattern.test(content) && !content.includes('karkey.ma')) {
                    // Content might contain hallucinated vehicles - add a warning
                    console.warn('[Chat] Potential hallucination detected in response');
                }
            }
        }

        return { content, vehicles };
    };

    const handleSubmit = useCallback(async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            id: generateId(),
            role: 'user',
            content: input.trim(),
        };

        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);
        setError(null);

        // Create assistant message placeholder
        const assistantId = generateId();
        setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

        try {
            abortControllerRef.current = new AbortController();

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages.map(m => ({ role: m.role, content: m.content })),
                    language,
                }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) throw new Error('No reader available');

            let fullText = '';
            let currentVehicles: ChatVehicle[] = [];

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                fullText += chunk;

                const { content, vehicles } = parseStreamChunk(fullText);
                if (vehicles.length > 0) {
                    currentVehicles = vehicles;
                }

                setMessages(prev =>
                    prev.map(m =>
                        m.id === assistantId
                            ? { ...m, content, vehicles: currentVehicles.length > 0 ? currentVehicles : undefined }
                            : m
                    )
                );
            }

        } catch (err) {
            if (err instanceof Error && err.name !== 'AbortError') {
                setError(err);
                // Remove empty assistant message on error
                setMessages(prev => prev.filter(m => m.id !== assistantId));
            }
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    }, [input, isLoading, messages, language]);

    const stop = useCallback(() => {
        abortControllerRef.current?.abort();
    }, []);

    const append = useCallback(async (message: { role: 'user' | 'assistant'; content: string }) => {
        setInput(message.content);
        // Trigger submit on next tick
        setTimeout(() => {
            const form = document.querySelector('form[data-chat-form]') as HTMLFormElement;
            form?.requestSubmit();
        }, 0);
    }, []);

    const clearChat = useCallback(() => {
        setMessages([]);
        setError(null);
        if (typeof window !== 'undefined') {
            localStorage.removeItem(storageKey);
        }
    }, [storageKey]);

    // Quick action helpers
    const askAboutAuctions = useCallback(() => {
        const question = language === 'ar'
            ? 'كيف تعمل المزادات في Karkey؟'
            : language === 'fr'
                ? 'Comment fonctionnent les enchères sur Karkey ?'
                : language === 'es'
                    ? '¿Cómo funcionan las subastas en Karkey?'
                    : 'How do auctions work on Karkey?';

        setInput(question);
        setTimeout(() => {
            const submitBtn = document.querySelector('[data-chat-submit]') as HTMLButtonElement;
            submitBtn?.click();
        }, 50);
    }, [language]);

    const askAboutSelling = useCallback(() => {
        const question = language === 'ar'
            ? 'كيف أبيع سيارتي على Karkey؟'
            : language === 'fr'
                ? 'Comment vendre ma voiture sur Karkey ?'
                : language === 'es'
                    ? '¿Cómo vendo mi coche en Karkey?'
                    : 'How do I sell my car on Karkey?';

        setInput(question);
        setTimeout(() => {
            const submitBtn = document.querySelector('[data-chat-submit]') as HTMLButtonElement;
            submitBtn?.click();
        }, 50);
    }, [language]);

    // Send a message directly (used by quick suggestions)
    const sendMessage = useCallback((message: string) => {
        setInput(message);
        setTimeout(() => {
            const submitBtn = document.querySelector('[data-chat-submit]') as HTMLButtonElement;
            submitBtn?.click();
        }, 50);
    }, []);

    return {
        messages,
        input,
        setInput,
        handleInputChange,
        handleSubmit,
        isLoading,
        error,
        stop,
        append,
        clearChat,
        askAboutAuctions,
        askAboutSelling,
        sendMessage,
    };
}
