/**
 * AI Configuration for Karkey Chatbot
 * 
 * Uses Groq with Llama models for fast, cost-effective inference.
 * Primary: llama-3.1-8b-instant (fast, low token usage)
 * Fallback: llama-3.3-70b-versatile (smarter but higher token usage)
 */

import { createGoogleGenerativeAI } from '@ai-sdk/google';

// Initialize Google AI client
export const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// Model configuration - using Gemini 2.5 Flash Lite
// User has increased quota for this model (4k RPM, 4M TPM).
// This is the best option for speed and cost.
export const AI_CONFIG = {
    model: 'gemini-2.5-flash-lite',
    intentModel: 'gemini-2.5-flash-lite',
    chatModel: 'gemini-2.5-flash-lite',
    temperature: 0.7,
    maxTokens: 1024,
} as const;

// Rate limiting for chat API
export const CHAT_RATE_LIMIT = {
    maxRequests: 20,      // Per user
    windowMs: 60 * 1000,  // 1 minute
} as const;
