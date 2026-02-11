import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { videoTitle, videoDescription, videoTags, niche, goal } = await req.json()

        if (!videoTitle) {
            return NextResponse.json({ error: 'Video title is required' }, { status: 400 })
        }

        const systemPrompt = `
      You are an expert YouTube SEO Strategist specializing in the "${niche || 'Software Engineering'}" niche.
      Your goal is to optimize a video's SEO for ${goal || 'Higher CTR'}.
      
      Requirements:
      1. Generate 3 compelling, viral titles that pique curiosity but avoid clickbait.
      2. Write an optimized video description (first 2 lines are most important).
      3. Suggest 10 high-ranking tags.
      4. Provide a brief "Reasoning" for why these changes will help.
      
      Format your response strictly as a JSON object:
      {
        "suggested_titles": ["title1", "title2", "title3"],
        "suggested_description": "...",
        "suggested_tags": ["tag1", "tag2", ...],
        "reasoning": "..."
      }
    `

        const userPrompt = `
      Original Title: ${videoTitle}
      Original Description: ${videoDescription}
      Original Tags: ${videoTags?.join(', ')}
    `

        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" }
        })

        const content = response.choices[0].message.content
        if (!content) throw new Error('Failed to generate SEO suggestions')

        const result = JSON.parse(content)

        return NextResponse.json(result)

    } catch (error: unknown) {
        console.error('AI Optimization error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'AI generation failed' },
            { status: 500 }
        )
    }
}
