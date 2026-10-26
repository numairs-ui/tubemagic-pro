import { NextResponse } from 'next/server'
import { z } from 'zod'
import { errorResponse, parseBody, requireUserId } from '@/lib/api'
import { getUserPlan, PLAN_LIMITS } from '@/lib/account'
import { enforceRateLimit } from '@/lib/rate-limit'
import { generateJson } from '@/lib/ai'
import { cached } from '@/lib/cache'
import { searchVideos } from '@/lib/youtube'

const bodySchema = z.object({
    query: z.string().trim().min(2, 'Query is required').max(100),
})

const metricsSchema = z.object({
    volume: z.union([z.string(), z.number()]).transform(String),
    difficulty: z.coerce.number(),
    intent: z.string(),
    analysis: z.string(),
    // Normalised to the { keyword, volume, difficulty } shape the Keyword Magic page renders.
    related: z.array(z.object({
        keyword: z.string().optional(),
        term: z.string().optional(),
        volume: z.union([z.string(), z.number()]).transform(String).optional(),
        difficulty: z.coerce.number().optional(),
    })).default([]).transform((items) => items
        .map((item) => ({
            keyword: item.keyword || item.term || '',
            volume: item.volume || '—',
            difficulty: Math.round(Math.max(0, Math.min(100, item.difficulty ?? 50))),
        }))
        .filter((item) => item.keyword)),
})

export async function POST(req: Request) {
    try {
        const userId = await requireUserId()
        const { query } = await parseBody(req, bodySchema)

        const plan = await getUserPlan(userId)
        await enforceRateLimit(`ai:${userId}`, PLAN_LIMITS[plan].aiPerHour, 60 * 60)

        // 1. Fetch YouTube search results to gauge "Supply" (100 units, cached 24h)
        const { totalResults, videos } = await searchVideos(query, 20)

        // 2. Generate related keywords & metrics via AI.
        // YouTube doesn't expose search volume, so these are AI estimates grounded in
        // result density. Cached per query so repeat lookups are free and consistent.
        const prompt = `
            Analyze the following YouTube search data for the query: "${query}"
            Total Results: ${totalResults}
            Top Video Titles: ${videos.map(v => v.title).join(', ')}

            Provide a JSON response with:
            1. volume: Estimated monthly searches (e.g., 10k, 500k)
            2. difficulty: 1 - 100 score based on total results and quality of top videos.
            3. intent: One of [Research, Tutorial, Comparison, Entertainment]
            4. related: An array of 5 objects { "keyword", "volume", "difficulty" } for related keywords.
            5. analysis: A 2 - sentence SEO strategy for this specific keyword.

            Format ONLY as JSON.
        `

        const { value: metrics } = await cached(`ai:keywords:${query.toLowerCase()}`, 24 * 60 * 60, async () => {
            const { data } = await generateJson({
                userKey: userId,
                dailyTokenBudget: PLAN_LIMITS[plan].dailyTokens,
                feature: 'keywords',
                schema: metricsSchema,
                system: 'You are a YouTube SEO Expert providing data-dense analytics.',
                user: prompt,
                maxOutputTokens: 600,
                temperature: 0.4,
            })
            return data
        })

        return NextResponse.json({
            keyword: query,
            metrics: {
                volume: metrics.volume,
                difficulty: metrics.difficulty,
                intent: metrics.intent,
                analysis: metrics.analysis
            },
            related: metrics.related,
            rawResults: totalResults
        })

    } catch (error: unknown) {
        return errorResponse(error, 'seo/keywords')
    }
}
