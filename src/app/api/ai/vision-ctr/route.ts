import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { errorResponse, parseBody, requireUserId } from '@/lib/api'
import { getUserPlan, PLAN_LIMITS } from '@/lib/account'
import { enforceRateLimit } from '@/lib/rate-limit'
import { gradeThumbnail, ctrResultSchema } from '@/lib/ctr-grader'

export const maxDuration = 60

const bodySchema = z.object({
    // Data URL from the uploader (already downscaled in the browser) or an https URL.
    image: z.string().min(10, 'Thumbnail image is required').max(12_000_000),
    title: z.string().trim().min(3, 'Title is required').max(120),
    niche: z.string().trim().max(80).optional(),
})

export async function POST(req: Request) {
    try {
        const userId = await requireUserId()
        const { image, title, niche } = await parseBody(req, bodySchema)

        const plan = await getUserPlan(userId)
        const limits = PLAN_LIMITS[plan]
        await enforceRateLimit(`vision:burst:${userId}`, 6, 60, 'One moment: you can grade up to 6 thumbnails per minute.')
        await enforceRateLimit(
            `vision:daily:${userId}`,
            limits.visionPerDay,
            24 * 60 * 60,
            plan === 'free'
                ? `Free plan includes ${limits.visionPerDay} CTR grades per day. Upgrade to Pro for 100/day.`
                : 'Daily CTR grading limit reached. Try again tomorrow.'
        )

        const graded = await gradeThumbnail({
            image,
            title,
            niche,
            profile: 'high',
            source: 'dashboard',
            userKey: userId,
            clerkUserId: userId,
            dailyTokenBudget: limits.dailyTokens,
        })

        return NextResponse.json({
            ...graded.result,
            evaluation_id: graded.evaluationId,
            cached: graded.cached,
            image_stats: graded.image,
        })
    } catch (error: unknown) {
        return errorResponse(error, 'ai/vision-ctr')
    }
}

/** Recent evaluations for the signed-in user (Packaging Studio history). */
export async function GET() {
    try {
        const userId = await requireUserId()
        const { data, error } = await supabaseAdmin
            .from('vision_evaluations')
            .select('id, title, niche, result, created_at')
            .eq('clerk_user_id', userId)
            .order('created_at', { ascending: false })
            .limit(12)

        if (error) return NextResponse.json({ history: [] })

        const history = (data || []).flatMap((row) => {
            const parsed = ctrResultSchema.safeParse(row.result)
            if (!parsed.success) return []
            return [{
                id: row.id,
                title: row.title,
                niche: row.niche,
                created_at: row.created_at,
                score: parsed.data.predicted_ctr_score,
                verdict: parsed.data.verdict,
            }]
        })
        return NextResponse.json({ history })
    } catch (error) {
        return errorResponse(error, 'ai/vision-ctr:history')
    }
}
