import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ApiError, errorResponse, getClientIp, hashIp, parseBody } from '@/lib/api'
import { enforceRateLimit } from '@/lib/rate-limit'
import { gradeThumbnail } from '@/lib/ctr-grader'
import { extractVideoId, getVideoDetails } from '@/lib/youtube'

export const maxDuration = 60

/**
 * Public, unauthenticated Thumbnail CTR Grader (the landing-page lead magnet).
 * Returns a teaser: the score, sub-scores and the single most important tip.
 * The full report is unlocked by email via /api/public/unlock.
 *
 * Cost controls: low-detail vision (85 image tokens), 30-day result cache,
 * per-IP daily cap, and a global daily cap across all anonymous visitors.
 */
const PER_IP_DAILY = Number(process.env.PUBLIC_GRADER_PER_IP_DAILY || 3)
const GLOBAL_DAILY = Number(process.env.PUBLIC_GRADER_GLOBAL_DAILY || 300)
const ANON_TOKEN_BUDGET = 12_000 // per IP per 24h; ~10 low-detail grades

const bodySchema = z.object({
    image: z.string().max(6_000_000).optional(),
    youtubeUrl: z.string().trim().max(300).optional(),
    title: z.string().trim().max(120).optional(),
    niche: z.string().trim().max(80).optional(),
})

export async function POST(req: Request) {
    try {
        const body = await parseBody(req, bodySchema)
        const ipKey = `ip:${hashIp(getClientIp(req))}`

        // Cheap validation first, so malformed requests never consume a grade.
        const videoId = !body.image && body.youtubeUrl ? extractVideoId(body.youtubeUrl) : null
        if (!body.image && !body.youtubeUrl) {
            throw new ApiError(400, 'invalid_request', 'Upload a thumbnail or paste a YouTube video link.')
        }
        if (!body.image && !videoId) {
            throw new ApiError(400, 'invalid_youtube_url', 'That does not look like a YouTube video link.')
        }
        if (body.image && (body.title || '').length < 3) {
            throw new ApiError(400, 'invalid_request', 'Add the title you plan to use (at least 3 characters).')
        }

        // Rate limits before any paid call (YouTube quota or OpenAI tokens).
        await enforceRateLimit(`public-grade:burst:${ipKey}`, 1, 10, 'Easy there. Wait a few seconds between grades.')
        await enforceRateLimit(
            `public-grade:daily:${ipKey}`,
            PER_IP_DAILY,
            24 * 60 * 60,
            `You have used your ${PER_IP_DAILY} free grades for today. Create a free account for more.`
        )
        await enforceRateLimit(
            'public-grade:global',
            GLOBAL_DAILY,
            24 * 60 * 60,
            'The free grader is at capacity today. Create a free account to keep grading.'
        )

        let image = body.image
        let title = body.title || ''
        let previewUrl: string | null = null

        if (!image && videoId) {
            const video = await getVideoDetails(videoId)
            image = video.thumbnailUrl
            previewUrl = video.thumbnailUrl
            title = title || video.title
        }
        if (!image) throw new ApiError(400, 'invalid_request', 'Upload a thumbnail or paste a YouTube video link.')

        const graded = await gradeThumbnail({
            image,
            title,
            niche: body.niche,
            profile: 'low',
            source: 'public',
            userKey: ipKey,
            clerkUserId: null,
            dailyTokenBudget: ANON_TOKEN_BUDGET,
        })

        const { result } = graded
        return NextResponse.json({
            evaluation_id: graded.evaluationId,
            title,
            preview_url: previewUrl,
            predicted_ctr_score: result.predicted_ctr_score,
            verdict: result.verdict,
            scores: result.scores,
            top_tip: result.actionable_tips[0] ?? null,
            locked: {
                strengths: result.strengths.length,
                weaknesses: result.weaknesses.length,
                actionable_tips: Math.max(result.actionable_tips.length - 1, 0),
                title_alternatives: result.title_alternatives.length,
                thumbnail_concepts: result.thumbnail_concepts.length,
            },
        })
    } catch (error) {
        return errorResponse(error, 'public/grade')
    }
}
