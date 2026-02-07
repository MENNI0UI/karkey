/**
 * AI Configuration for Karkey Chatbot
 * 
 * Uses Groq with Llama models for fast, cost-effective inference.
 * Primary: llama-3.1-8b-instant (fast, low token usage)
 * Fallback: llama-3.3-70b-versatile (smarter but higher token usage)
 */

import { createGroq } from '@ai-sdk/groq';

// Initialize Groq client
export const groq = createGroq({
    apiKey: process.env.GROQ_API_KEY,
});

// Model configuration - using smaller model to save tokens
export const AI_CONFIG = {
    model: 'llama-3.1-8b-instant',           // Fast, low token usage
    intentModel: 'llama-3.1-8b-instant',     // For search intent extraction
    chatModel: 'llama-3.1-8b-instant',       // For chat responses
    temperature: 0.7,
    maxTokens: 512,
} as const;

// Rate limiting for chat API
export const CHAT_RATE_LIMIT = {
    maxRequests: 20,      // Per user
    windowMs: 60 * 1000,  // 1 minute
} as const;
