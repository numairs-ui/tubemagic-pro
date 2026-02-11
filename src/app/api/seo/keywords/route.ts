import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { google, youtube_v3 } from 'googleapis'

const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY,
})

export async function POST(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { query } = await req.json()
        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 })
        }

        // 1. Fetch YouTube search results to gauge "Supply"
        const searchResponse = await youtube.search.list({
            part: ['snippet'],
            q: query,
            type: ['video'],
            maxResults: 20,
            relevanceLanguage: 'en',
        })

        const totalResults = parseInt(searchResponse.data.pageInfo?.totalResults?.toString() || '0')

        // Define videos array properly with types
        const videos = searchResponse.data.items?.map((item: youtube_v3.Schema$SearchResult) => ({
            id: item.id?.videoId,
            title: item.snippet?.title,
            description: item.snippet?.description,
            publishedAt: item.snippet?.publishedAt,
            thumbnail: item.snippet?.thumbnails?.default?.url,
        })) || []

        // 2. Generate related keywords & metrics via AI
        // Since YouTube doesn't give us exact search volume, we use AI to simulate 
        // a "professional" dataset based on search result density and query nuances.

        const prompt = `
            Analyze the following YouTube search data for the query: "${query}"
            Total Results: ${totalResults}
            Top Video Titles: ${videos.map(v => v.title).join(', ')}

            Provide a JSON response with:
            1. volume: Estimated monthly searches(e.g., 10k, 500k)
            2. difficulty: 1 - 100 score based on total results and quality of top videos.
            3. intent: One of[Research, Tutorial, Comparison, Entertainment]
            4. related: An array of 5 related keyword strings with their own(volume, difficulty) estimates.
            5. analysis: A 2 - sentence SEO strategy for this specific keyword.

            Format ONLY as JSON.
        `

        const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4-turbo-preview",
                messages: [{ role: "system", content: "You are a YouTube SEO Expert providing data-dense analytics." }, { role: "user", content: prompt }],
                response_format: { type: "json_object" }
            })
        })

        const aiData = await aiResponse.json()
        const metrics = JSON.parse(aiData.choices[0].message.content)

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
        console.error('Keyword Analytics Error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to analyze keyword'
        return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
}
