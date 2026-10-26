import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { z } from 'zod'

/**
 * An error that is safe to show to the client. Anything else thrown inside a
 * route handler is logged and reported as a generic 500.
 */
export class ApiError extends Error {
    constructor(
        public status: number,
        public code: string,
        message: string,
        public headers?: Record<string, string>
    ) {
        super(message)
        this.name = 'ApiError'
    }
}

export function errorResponse(error: unknown, context: string) {
    if (error instanceof ApiError) {
        if (error.status >= 500) console.error(`[${context}] ${error.code}: ${error.message}`)
        return NextResponse.json(
            { error: error.message, code: error.code },
            { status: error.status, headers: error.headers }
        )
    }

    console.error(`[${context}] Unhandled error:`, error)
    return NextResponse.json(
        { error: 'Something went wrong on our side. Please try again.', code: 'internal_error' },
        { status: 500 }
    )
}

/**
 * Parse and validate a JSON request body, throwing a 400 with the first issue.
 * An empty body is treated as `{}` so endpoints with all-optional fields accept it.
 */
export async function parseBody<T extends z.ZodTypeAny>(req: Request, schema: T): Promise<z.infer<T>> {
    let raw: unknown
    try {
        const text = await req.text()
        raw = text.trim() ? JSON.parse(text) : {}
    } catch {
        throw new ApiError(400, 'invalid_json', 'Request body must be valid JSON.')
    }

    const parsed = schema.safeParse(raw)
    if (!parsed.success) {
        const issue = parsed.error.issues[0]
        const field = issue.path.join('.')
        throw new ApiError(400, 'invalid_request', field ? `${field}: ${issue.message}` : issue.message)
    }
    return parsed.data
}

/** Returns the Clerk user id or throws a 401. */
export async function requireUserId(): Promise<string> {
    const { userId } = await auth()
    if (!userId) throw new ApiError(401, 'unauthorized', 'Unauthorized')
    return userId
}

/** Best-effort client IP from Vercel / proxy headers. */
export function getClientIp(req: Request): string {
    const forwarded = req.headers.get('x-forwarded-for')
    if (forwarded) return forwarded.split(',')[0].trim()
    return req.headers.get('x-real-ip') || 'unknown'
}

/** Salted hash so raw IPs are never stored. */
export function hashIp(ip: string): string {
    return createHash('sha256')
        .update(`${process.env.IP_HASH_SALT || 'tubemagic'}:${ip}`)
        .digest('hex')
        .slice(0, 32)
}

export function sha256(input: string | Buffer): string {
    return createHash('sha256').update(input).digest('hex')
}
