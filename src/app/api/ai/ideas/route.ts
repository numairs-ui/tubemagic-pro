import { NextResponse } from 'next/server'
import { z } from 'zod'
import { errorResponse, parseBody, requireUserId } from '@/lib/api'
import { getUserPlan, PLAN_LIMITS } from '@/lib/account'
import { enforceRateLimit } from '@/lib/rate-limit'
import { generateJson } from '@/lib/ai'

const bodySchema = z.object({
    niche: z.string().trim().max(80).optional(),
})

const resultSchema = z.object({
    ideas: z.array(z.object({
        title: z.string(),
        hook: z.string(),
        keywords: z.array(z.string()).default([]),
    })),
})

export async function POST(req: Request) {
    try {
        const userId = await requireUserId()
        const { niche } = await parseBody(req, bodySchema)

        const plan = await getUserPlan(userId)
        await enforceRateLimit(`ai:${userId}`, PLAN_LIMITS[plan].aiPerHour, 60 * 60)

        const systemPrompt = `
      You are an expert YouTube Content Strategist for the "${niche || 'Software Engineering'}" niche.
      Your goal is to generate 10 high-potential, viral video ideas that are trending or have high search demand.

      For each idea, provide:
      1. A compelling Title.
      2. A brief "Hook" (why people will click).
      3. Target Keywords.

      Format your response strictly as a JSON object:
      {
        "ideas": [
          { "title": "...", "hook": "...", "keywords": ["...", "..."] },
          ...
        ]
      }
    `

        const { data } = await generateJson({
            userKey: userId,
            dailyTokenBudget: PLAN_LIMITS[plan].dailyTokens,
            feature: 'ideas',
            schema: resultSchema,
            system: systemPrompt,
            user: 'Generate 10 viral video ideas for my channel.',
            maxOutputTokens: 1200,
            temperature: 0.9,
        })

        return NextResponse.json(data)

    } catch (error: unknown) {
        return errorResponse(error, 'ai/ideas')
    }
}
