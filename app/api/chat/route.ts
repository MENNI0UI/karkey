/**
 * Chat API Route - AI Tool Calling Architecture
 * 
 * Simplified chat handler using AI tool calling.
 * The AI decides when to search and with what parameters.
 */

import { streamText } from 'ai';
import { google, AI_CONFIG } from '@/lib/ai/config';
import { getSystemPrompt } from '@/lib/ai/system-prompt';
import { searchVehicles, ChatVehicle } from '@/lib/ai/tools';
import { isRateLimited, getIp } from '@/lib/rate-limiter';
import { z } from 'zod';

// Rate limit config for chat
const CHAT_RATE_LIMIT = {
    limit: 30,
    windowMs: 60 * 1000, // 30 requests per minute
};

export async function POST(req: Request) {
    try {
        // Rate limiting
        const ip = getIp(req);
        if (await isRateLimited(ip, CHAT_RATE_LIMIT)) {
            return new Response(
                JSON.stringify({ error: 'Rate limited. Please wait a moment.' }),
                { status: 429, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const body = await req.json();
        const { messages, language = 'en' } = body;

        if (!messages || !Array.isArray(messages)) {
            return new Response(
                JSON.stringify({ error: 'Messages array required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Filter out any system messages from history (Google AI doesn't support them mid-conversation)
        const validMessages = messages.filter((m: { role: string }) => m.role !== 'system');

        console.log('[Chat API] Processing request with', validMessages.length, 'messages');

        // Track vehicle results from tool calls
        let vehicleResults: ChatVehicle[] = [];
        let totalVehicleCount = 0;

        // Stream response with AI tool calling
        const result = streamText({
            model: google(AI_CONFIG.model),
            system: getSystemPrompt(language),
            messages: validMessages,
            tools: {
                searchVehicles: {
                    description: `Search for vehicles in the Karkey database. This tool is UNIFIED and searches across all sources: Sale items, Auctions, and Karkey-verified cars.
    
IMPORTANT:
- Use listingType: "all" (default) for general queries.
- Use listingType: "auction" for terms like "مزاد", "enchère", or "bid".
- Use listingType: "karkey" for terms like "سيارات كاركي", "karkey cars", or "verified".
- Use listingType: "sale" for regular "vente direct" or "للبيع".
- For "أغلى سيارة" (most expensive car), use sortBy: "price", sortOrder: "desc"
- For "أرخص سيارة" (cheapest car), use sortBy: "price", sortOrder: "asc"
- For "أحدث سيارة" (newest car), use sortBy: "year", sortOrder: "desc"
- For cities like "الدار البيضاء" or "كازا", use location: "Casablanca"
- For cities like "مراكش", use location: "Marrakech"
- For "أبواب" (doors), use the doors field (e.g., "3", "5")
- For "محرك" (engine size), use minEngineSize and maxEngineSize (e.g., 2.2)
- DO NOT confuse city names with colors (الدار البيضاء is a city, not white color)`,
                    inputSchema: z.object({
                        make: z.string().optional().describe('Car brand like Toyota, BMW, Renault, Mercedes'),
                        model: z.string().optional().describe('Car model like Corolla, Golf, Clio'),
                        minPrice: z.number().optional().describe('Minimum price in DH'),
                        maxPrice: z.number().optional().describe('Maximum price in DH'),
                        location: z.string().optional().describe('City name in English: Casablanca, Rabat, Marrakech, Tangier, Fes, Agadir'),
                        fuelType: z.enum(['gasoline', 'diesel', 'electric', 'hybrid']).optional(),
                        transmission: z.enum(['automatic', 'manual']).optional(),
                        minYear: z.number().optional().describe('Minimum year like 2015'),
                        maxYear: z.number().optional().describe('Maximum year like 2024'),
                        minMileage: z.number().optional().describe('Minimum mileage in km'),
                        maxMileage: z.number().optional().describe('Maximum mileage in km'),
                        exteriorColor: z.string().optional().describe('Color in English: white, black, red, blue, silver, gray'),
                        vehicleCondition: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
                        doors: z.string().optional().describe('Number of doors like "2", "3", "4", "5"'),
                        listingType: z.enum(['sale', 'auction', 'karkey', 'all']).optional().describe('Filter by type: sale (direct), auction, karkey (trusted), or all'),
                        minEngineSize: z.number().optional().describe('Minimum engine size in liters like 1.6, 2.0'),
                        maxEngineSize: z.number().optional().describe('Maximum engine size in liters like 1.6, 2.0'),
                        sortBy: z.enum(['price', 'year', 'mileage', 'created_at']).optional().describe('Sort field'),
                        sortOrder: z.enum(['asc', 'desc']).optional().describe('Sort direction'),
                        limit: z.number().optional().describe('Number of results to return, default 16'),
                    }),
                    execute: async (params: Record<string, unknown>) => {
                        console.log('[AI Tool] searchVehicles called with:', JSON.stringify(params));
                        const searchResult = await searchVehicles(params as any);
                        console.log('[AI Tool] searchVehicles returned:', searchResult.count, 'vehicles');

                        // Store results for later injection
                        vehicleResults = searchResult.vehicles;
                        totalVehicleCount = searchResult.count;

                        // Return a summary for the AI to describe
                        if (searchResult.vehicles.length > 0) {
                            const summary = searchResult.vehicles.slice(0, 10).map((v, i) =>
                                `${i + 1}. ${v.make} ${v.model} (${v.year}) - ${v.price} DH - ${v.mileage} km - ${v.fuel_type} - ${v.condition}`
                            ).join('\n');

                            return {
                                success: true,
                                count: searchResult.count,
                                message: `Found ${searchResult.count} vehicles. \n\nResults Metadata:\n${summary}\n\nINSTRUCTION: Now, summarize these results for the user and provide a professional analysis/comparison of the best options found. Mention specific details to show expertise.`,
                                vehicles: searchResult.vehicles
                            };
                        } else {
                            return {
                                success: true,
                                count: 0,
                                message: 'No vehicles found matching these criteria.',
                                vehicles: []
                            };
                        }
                    },
                },
            },
            // @ts-ignore - maxSteps IS supported at runtime but missing from types in this version
            maxSteps: 10,
            temperature: 0.7,
        });

        // Process the stream and inject vehicle data markers
        const encoder = new TextEncoder();

        const responseStream = new ReadableStream({
            async start(controller) {
                try {
                    let hasInjectedVehicles = false;

                    // Process all parts from the AI stream
                    for await (const part of result.fullStream) {
                        console.log('[Stream Part]', part.type);

                        // When we get the first text and have vehicles, inject them
                        if (part.type === 'text-delta' && !hasInjectedVehicles && vehicleResults.length > 0) {
                            hasInjectedVehicles = true;
                            const vehiclesData = JSON.stringify({
                                type: 'vehicles',
                                data: vehicleResults,
                                totalCount: totalVehicleCount
                            });
                            controller.enqueue(encoder.encode(`__VEHICLES__${vehiclesData}__END_VEHICLES__`));
                        }

                        if (part.type === 'text-delta') {
                            // Regular text - send to client
                            controller.enqueue(encoder.encode(part.text));
                        }
                    }

                    // If we got vehicles but no text yet, inject them at the end
                    if (!hasInjectedVehicles && vehicleResults.length > 0) {
                        const vehiclesData = JSON.stringify({
                            type: 'vehicles',
                            data: vehicleResults,
                            totalCount: totalVehicleCount
                        });
                        controller.enqueue(encoder.encode(`__VEHICLES__${vehiclesData}__END_VEHICLES__`));
                    }
                } catch (error) {
                    console.error('[Chat API] Stream error:', error);
                    controller.enqueue(encoder.encode('Sorry, there was an error processing your request.'));
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(responseStream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });

    } catch (error) {
        console.error('[Chat API Error]', error);
        return new Response(
            JSON.stringify({ error: 'Failed to process chat message' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
