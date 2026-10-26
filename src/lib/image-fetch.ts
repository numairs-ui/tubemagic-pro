import { lookup } from 'dns/promises'
import { isIP } from 'net'
import { ApiError } from '@/lib/api'
import { isPrivateAddress } from '@/lib/net-guard'

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const FETCH_TIMEOUT_MS = 8_000
const MAX_REDIRECTS = 3

async function assertPublicUrl(raw: string): Promise<URL> {
    let url: URL
    try {
        url = new URL(raw)
    } catch {
        throw new ApiError(400, 'invalid_image_url', 'Thumbnail URL is not a valid URL.')
    }
    if (url.protocol !== 'https:') {
        throw new ApiError(400, 'invalid_image_url', 'Thumbnail URL must start with https://')
    }

    const host = url.hostname.replace(/^\[|\]$/g, '')
    const addresses = isIP(host) ? [host] : (await lookup(host, { all: true }).catch(() => [])).map((r) => r.address)
    if (addresses.length === 0) {
        throw new ApiError(400, 'invalid_image_url', 'Could not resolve the thumbnail URL host.')
    }
    if (addresses.some(isPrivateAddress)) {
        throw new ApiError(400, 'invalid_image_url', 'Thumbnail URL must point to a public host.')
    }
    return url
}

/**
 * Download a remote image with SSRF protection (public https hosts only, every
 * redirect re-validated), a timeout, and a hard size cap.
 */
export async function fetchRemoteImage(rawUrl: string): Promise<Buffer> {
    let target = await assertPublicUrl(rawUrl)

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
        const res = await fetch(target, {
            redirect: 'manual',
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
            headers: { Accept: 'image/*' },
        }).catch(() => {
            throw new ApiError(400, 'image_fetch_failed', 'Could not download the thumbnail. Check that the URL is public.')
        })

        if (res.status >= 300 && res.status < 400) {
            const location = res.headers.get('location')
            if (!location) break
            target = await assertPublicUrl(new URL(location, target).toString())
            continue
        }

        if (!res.ok) {
            throw new ApiError(400, 'image_fetch_failed', `Thumbnail URL returned HTTP ${res.status}.`)
        }

        const contentType = res.headers.get('content-type') || ''
        if (!contentType.startsWith('image/')) {
            throw new ApiError(400, 'not_an_image', 'That URL does not point to an image.')
        }

        const declared = Number(res.headers.get('content-length') || 0)
        if (declared > MAX_IMAGE_BYTES) {
            throw new ApiError(413, 'image_too_large', 'Thumbnail is larger than 8 MB.')
        }

        const buffer = Buffer.from(await res.arrayBuffer())
        if (buffer.length > MAX_IMAGE_BYTES) {
            throw new ApiError(413, 'image_too_large', 'Thumbnail is larger than 8 MB.')
        }
        return buffer
    }

    throw new ApiError(400, 'image_fetch_failed', 'Too many redirects while downloading the thumbnail.')
}

/** Decode a `data:image/...;base64,` URL produced by the browser uploader. */
export function decodeImageDataUrl(dataUrl: string): Buffer {
    const match = dataUrl.match(/^data:image\/(png|jpe?g|webp|gif);base64,([A-Za-z0-9+/=]+)$/)
    if (!match) throw new ApiError(400, 'invalid_image', 'Upload a PNG, JPG, WebP or GIF image.')

    const buffer = Buffer.from(match[2], 'base64')
    if (buffer.length > MAX_IMAGE_BYTES) throw new ApiError(413, 'image_too_large', 'Thumbnail is larger than 8 MB.')
    return buffer
}

/** Accept either an uploaded data URL or a public https URL. */
export async function loadImage(image: string): Promise<Buffer> {
    return image.startsWith('data:') ? decodeImageDataUrl(image) : fetchRemoteImage(image)
}
