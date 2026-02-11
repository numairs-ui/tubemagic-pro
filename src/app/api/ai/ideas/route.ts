import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabase'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { niche } = await req.json()

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

        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "Generate 10 viral video ideas for my channel." }
            ],
            response_format: { type: "json_object" }
        })

        const content = response.choices[0].message.content
        if (!content) throw new Error('Failed to generate ideas')

        const result = JSON.parse(content)

        return NextResponse.json(result)

    } catch (error: unknown) {
        console.error('AI Ideas error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'AI generation failed' },
            { status: 500 }
        )
    }
}
