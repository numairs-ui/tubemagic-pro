import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { ApiError, errorResponse, getClientIp, hashIp, parseBody } from '@/lib/api'
import { enforceRateLimit } from '@/lib/rate-limit'
import { getEvaluation } from '@/lib/ctr-grader'

const bodySchema = z.object({
    email: z.string().trim().toLowerCase().email('Enter a valid email address').max(254),
    evaluationId: z.string().uuid(),
})

/** Exchange an email for the full public grader report (lead capture). */
export async function POST(req: Request) {
    try {
        const { email, evaluationId } = await parseBody(req, bodySchema)
        const ipHash = hashIp(getClientIp(req))
        await enforceRateLimit(`public-unlock:${ipHash}`, 10, 60 * 60)

        const evaluation = await getEvaluation(evaluationId)
        if (!evaluation || evaluation.source !== 'public') {
            throw new ApiError(404, 'evaluation_not_found', 'That report has expired. Grade your thumbnail again.')
        }

        const { error } = await supabaseAdmin.from('grader_leads').insert({
            email,
            evaluation_id: evaluation.id,
            ip_hash: ipHash,
        })
        if (error) console.warn('[public/unlock] Lead not stored:', error.message)

        return NextResponse.json({ title: evaluation.title, ...evaluation.result })
    } catch (error) {
        return errorResponse(error, 'public/unlock')
    }
}
