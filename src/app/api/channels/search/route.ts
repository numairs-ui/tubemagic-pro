import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { searchChannels } from '@/lib/youtube'

export async function GET(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const query = searchParams.get('q')

        if (!query) {
            return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
        }

        const channels = await searchChannels(query)

        return NextResponse.json({ channels })
    } catch (error: unknown) {
        console.error('Search channel error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to search channels' },
            { status: 500 }
        )
    }
}
