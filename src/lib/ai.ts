import OpenAI from 'openai'
import type { ChatCompletionContentPart, ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { ApiError } from '@/lib/api'

export const TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || 'gpt-4o-mini'
export const VISION_MODEL = process.env.OPENAI_VISION_MODEL || 'gpt-4o'

// Hard ceiling across all users per rolling 24h. Protects the OpenAI bill if a
// limit is misconfigured or the public grader is hammered.
const GLOBAL_DAILY_TOKENS = Number(process.env.OPENAI_GLOBAL_DAILY_TOKEN_BUDGET || 3_000_000)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface GenerateJsonOptions<T extends z.ZodTypeAny> {
    /** Clerk user id, or `ip:<hash>` for anonymous callers. Used for budgeting. */
    userKey: string
    /** Rolling 24h token budget for this caller. */
    dailyTokenBudget: number
    feature: string
    schema: T
    system: string
    user: string | ChatCompletionContentPart[]
    model?: string
    maxOutputTokens?: number
    temperature?: number
}

export interface TokenUsage {
    promptTokens: number
    completionTokens: number
}

async function tokensUsedSince(userKey: string | null, since: Date): Promise<number | null> {
    const { data, error } = await supabaseAdmin.rpc('ai_tokens_used_since', {
        p_user_key: userKey,
        p_since: since.toISOString(),
    })
    if (error) return null // ledger not migrated yet: fail open
    return Number(data ?? 0)
}

/** Throws 429/503 when the caller or the whole app is over its token budget. */
export async function assertTokenBudget(userKey: string, dailyTokenBudget: number) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const [userUsed, globalUsed] = await Promise.all([
        tokensUsedSince(userKey, since),
        tokensUsedSince(null, since),
    ])

    if (globalUsed !== null && globalUsed >= GLOBAL_DAILY_TOKENS) {
        throw new ApiError(503, 'ai_capacity', 'AI capacity is temporarily exhausted. Please try again later.')
    }
    if (userUsed !== null && userUsed >= dailyTokenBudget) {
        throw new ApiError(
            429,
            'token_budget_exceeded',
            'You have reached your daily AI limit. Upgrade your plan or try again tomorrow.'
        )
    }
}

async function recordUsage(userKey: string, feature: string, model: string, usage: TokenUsage) {
    const { error } = await supabaseAdmin.from('ai_usage').insert({
        user_key: userKey,
        feature,
        model,
        prompt_tokens: usage.promptTokens,
        completion_tokens: usage.completionTokens,
    })
    if (error) console.warn('[ai] Failed to record token usage:', error.message)
}

function mapOpenAIError(error: unknown): never {
    if (error instanceof OpenAI.APIError) {
        if (error.status === 429) {
            throw new ApiError(503, 'ai_rate_limited', 'The AI provider is busy. Please retry in a minute.')
        }
        if (error.status === 400) {
            throw new ApiError(422, 'ai_rejected_input', 'The AI could not process this input. Try a different image or text.')
        }
        throw new ApiError(502, 'ai_upstream_error', 'The AI provider returned an error. Please try again.')
    }
    throw error
}

/**
 * Run a JSON-mode chat completion with budget enforcement, output-token caps,
 * schema validation of the model's answer, and usage accounting.
 */
export async function generateJson<T extends z.ZodTypeAny>(
    options: GenerateJsonOptions<T>
): Promise<{ data: z.infer<T>; usage: TokenUsage; model: string }> {
    const model = options.model || TEXT_MODEL
    await assertTokenBudget(options.userKey, options.dailyTokenBudget)

    const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: options.system },
        { role: 'user', content: options.user },
    ]

    let completion: OpenAI.Chat.Completions.ChatCompletion
    try {
        completion = await openai.chat.completions.create({
            model,
            messages,
            response_format: { type: 'json_object' },
            max_completion_tokens: options.maxOutputTokens ?? 900,
            temperature: options.temperature ?? 0.7,
        })
    } catch (error) {
        mapOpenAIError(error)
    }

    const usage: TokenUsage = {
        promptTokens: completion.usage?.prompt_tokens ?? 0,
        completionTokens: completion.usage?.completion_tokens ?? 0,
    }
    await recordUsage(options.userKey, options.feature, model, usage)

    const content = completion.choices[0]?.message?.content
    if (!content) throw new ApiError(502, 'ai_empty_response', 'The AI returned an empty response. Please try again.')

    let json: unknown
    try {
        json = JSON.parse(content)
    } catch {
        throw new ApiError(502, 'ai_invalid_response', 'The AI returned malformed output. Please try again.')
    }

    const parsed = options.schema.safeParse(json)
    if (!parsed.success) {
        console.warn(`[ai] ${options.feature} schema mismatch:`, parsed.error.issues.slice(0, 3))
        throw new ApiError(502, 'ai_invalid_response', 'The AI returned an unexpected format. Please try again.')
    }

    return { data: parsed.data, usage, model }
}
