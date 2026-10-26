import { supabaseAdmin } from '@/lib/supabase'
import { ApiError } from '@/lib/api'

/**
 * Fixed-window rate limiting backed by the `consume_rate_limit` Postgres function,
 * so limits hold across serverless instances. Falls back to a per-instance memory
 * window if the function is missing, which still blunts bursts on one instance.
 */

interface RateLimitResult {
    allowed: boolean
    remaining: number
    resetAt: Date
}

const memoryWindows = new Map<string, { start: number; hits: number }>()
let warnedUnavailable = false

function consumeLocally(key: string, limit: number, windowSeconds: number): RateLimitResult {
    const now = Date.now()
    const windowMs = windowSeconds * 1000
    const entry = memoryWindows.get(key)
    const current = entry && entry.start + windowMs > now ? entry : { start: now, hits: 0 }

    const allowed = current.hits < limit
    if (allowed) current.hits += 1
    memoryWindows.set(key, current)

    return {
        allowed,
        remaining: Math.max(0, limit - current.hits),
        resetAt: new Date(current.start + windowMs),
    }
}

export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    const { data, error } = await supabaseAdmin.rpc('consume_rate_limit', {
        p_key: key,
        p_limit: limit,
        p_window_seconds: windowSeconds,
    })

    if (error || !data?.[0]) {
        if (!warnedUnavailable) {
            warnedUnavailable = true
            console.warn('[rate-limit] consume_rate_limit unavailable, using memory fallback.', error)
        }
        return consumeLocally(key, limit, windowSeconds)
    }

    const row = data[0] as { allowed: boolean; remaining: number; reset_at: string }
    return { allowed: row.allowed, remaining: row.remaining, resetAt: new Date(row.reset_at) }
}

/** Consume one hit or throw a 429 with a Retry-After header. */
export async function enforceRateLimit(
    key: string,
    limit: number,
    windowSeconds: number,
    message = 'Too many requests. Please slow down and try again shortly.'
): Promise<RateLimitResult> {
    const result = await rateLimit(key, limit, windowSeconds)
    if (!result.allowed) {
        const retryAfter = Math.max(1, Math.ceil((result.resetAt.getTime() - Date.now()) / 1000))
        throw new ApiError(429, 'rate_limited', message, {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
        })
    }
    return result
}
