import { generateText } from 'ai';
import { google, AI_CONFIG } from '@/lib/ai/config';
import { z } from 'zod';

export async function POST(req: Request) {
    try {
        const { vehicles, language = 'en' } = await req.json();

        if (!vehicles || !Array.isArray(vehicles) || vehicles.length === 0) {
            return new Response(JSON.stringify({ error: 'Vehicles list required' }), { status: 400 });
        }

        const vehicleInfo = vehicles.map(v =>
            `- ${v.make} ${v.model} (${v.year}): ${v.price} MAD, ${v.mileage || 0}km, ${v.transmission}, ${v.fuel_type}`
        ).join('\n');

        const systemPrompts = {
            ar: "أنت 'خبير كركي الذكي' (Karkey Smart Advisor). مهمتك هي مساعدة المستخدم في فهم الفروقات بين السيارات بأسلوب خبير، مفيد، وودود. ركز على: 1. تقديم نصائح عملية بناءً على حالة السوق المغربي. 2. توضيح نقاط القوة والضعف لكل سيارة ببساطة ووضوح. 3. تقديم توصية نهائية محايدة تساعد المستخدم على اتخاذ القرار الصحيح. ابدأ بجدول مقارنة بسيط ثم تحليل ودي وعملي.",
            en: "You are the 'Karkey Smart Advisor'. Your goal is to help users understand vehicle differences in an expert, helpful, and friendly way. Focus on: 1. Practical advice based on the Moroccan market. 2. Clearly explaining strengths and weaknesses of each car. 3. Providing a neutral recommendation to help the user decide. Start with a clean comparison table followed by friendly, actionable insights.",
            fr: "Vous êtes le 'Conseiller Intelligent Karkey'. Votre objectif est d'aider les utilisateurs à comprendre les différences entre les véhicules de manière experte, utile et amicale. Concentrez-vous sur : 1. Des conseils pratiques basés sur le marché marocain. 2. Expliquer clairement les points forts et les points faibles de chaque voiture. 3. Fournir une recommandation neutre pour aider l'utilisateur à décider. Commencez par un tableau de comparaison clair suivi d'analyses amicales et exploitables.",
            es: "Eres el 'Asesor Inteligente Karkey'. Tu objetivo es ayudar a los usuarios a comprender las diferencias entre los vehículos de una manera experta, útil y amigable. Concéntrate en: 1. Consejos prácticos basados en el mercado marroquí. 2. Explicar claramente las fortalezas y debilidades de cada coche. 3. Proporcionar una recomendación neutral para ayudar al usuario a decidir. Comienza con una tabla de comparación limpia seguida de información amigable y útil."
        };

        const userPrompts = {
            ar: `بصفتك خبير كركي الذكي، ساعدني في المقارنة بين هذه السيارات بأسلوب ودي وعملي للمستهلك المغربي:\n\n${vehicleInfo}\n\n1. جدول المقارنة.\n2. رأي الخبير (ببساطة، أي سيارة تنصح بها ولماذا؟).`,
            en: `As the Karkey Smart Advisor, help me compare these vehicles in a friendly and practical way for the Moroccan consumer:\n\n${vehicleInfo}\n\n1. Comparison Table.\n2. Advisor's Insight (Simply, which car do you recommend and why?).`,
            fr: `En tant que Conseiller Intelligent Karkey, aidez-moi à comparer ces véhicules de manière amicale et pratique pour le consommateur marocain :\n\n${vehicleInfo}\n\n1. Tableau de comparaison.\n2. L'avis du conseiller (Simplement, quelle voiture recommandez-vous et pourquoi ?).`,
            es: `Como Asesor Inteligente Karkey, ayúdame a comparar estos vehículos de una manera amigable y práctica para el consumidor marroquí:\n\n${vehicleInfo}\n\n1. Tabla comparativa.\n2. Opinión del asesor (Simplemente, ¿qué coche recomiendas y por qué?).`
        };

        const systemPrompt = systemPrompts[language as keyof typeof systemPrompts] || systemPrompts.en;
        const prompt = userPrompts[language as keyof typeof userPrompts] || userPrompts.en;

        const { text } = await generateText({
            model: google(AI_CONFIG.model),
            system: systemPrompt,
            prompt: prompt,
            temperature: 0.2, // Lowered further for maximum precision and expert consistency
        });

        return new Response(JSON.stringify({ summary: text }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('[AI Compare Error]', error);
        return new Response(JSON.stringify({ error: 'Failed to analyze vehicles' }), { status: 500 });
    }
}
