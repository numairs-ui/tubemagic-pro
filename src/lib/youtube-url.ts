// Pure YouTube URL/format helpers. No imports so they are unit-testable with `node --test`.

/**
 * Extracts the channel ID or handle from various YouTube URL formats
 * Supports:
 * - https://youtube.com/@handle
 * - https://youtube.com/channel/UC...
 * - UC... (Direct ID)
 * - @handle (Direct handle)
 */
export function extractChannelIdOrHandle(input: string): string {
    const trimmed = input.trim()

    if (trimmed.includes('youtube.com/')) {
        try {
            const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)

            // Handle @handle format
            if (url.pathname.startsWith('/@')) {
                return decodeURIComponent(url.pathname.substring(1).split('/')[0])
            }

            // Handle /channel/UC... format
            if (url.pathname.startsWith('/channel/')) {
                return url.pathname.split('/')[2]
            }
        } catch {
            // Not a parseable URL: fall through to the raw value
        }
    }

    return trimmed
}

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/

/** Returns the 11-char video id from a watch/shorts/youtu.be/embed URL or a bare id. */
export function extractVideoId(input: string): string | null {
    const trimmed = input.trim()
    if (VIDEO_ID.test(trimmed)) return trimmed

    let url: URL
    try {
        url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    } catch {
        return null
    }

    const host = url.hostname.replace(/^www\.|^m\./, '')
    let candidate: string | null = null

    if (host === 'youtu.be') {
        candidate = url.pathname.slice(1).split('/')[0]
    } else if (host === 'youtube.com' || host === 'music.youtube.com') {
        if (url.pathname === '/watch') candidate = url.searchParams.get('v')
        else {
            const match = url.pathname.match(/^\/(shorts|embed|live|v)\/([^/?#]+)/)
            candidate = match?.[2] ?? null
        }
    }

    return candidate && VIDEO_ID.test(candidate) ? candidate : null
}

/** Convert an ISO 8601 duration (like PT1M30S) to seconds. */
export function parseISO8601Duration(duration: string): number {
    const match = duration.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return 0
    const days = parseInt(match[1] || '0')
    const hours = parseInt(match[2] || '0')
    const minutes = parseInt(match[3] || '0')
    const seconds = parseInt(match[4] || '0')
    return days * 86400 + hours * 3600 + minutes * 60 + seconds
}

/** A channel's uploads playlist id is its channel id with the UC prefix swapped for UU. */
export function uploadsPlaylistId(channelId: string): string {
    return channelId.startsWith('UC') ? `UU${channelId.slice(2)}` : channelId
}
