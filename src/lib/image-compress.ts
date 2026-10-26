import sharp from 'sharp'
import { createHash } from 'crypto'

/**
 * Vision token cost is driven by image dimensions, not file size. For GPT-4o:
 *   detail "low"  -> flat 85 tokens (model sees ~512px)
 *   detail "high" -> 85 + 170 per 512px tile after scaling (shortest side <= 768)
 * A raw 1280x720 thumbnail at "high" is 6 tiles (~1,105 tokens). Downscaling to
 * 768x432 first makes it 2 tiles (~425 tokens) with no loss in what matters for
 * a thumbnail that viewers see at ~360px wide on mobile.
 */
export const VISION_PROFILES = {
    // Public grader: cheapest possible evaluation.
    low: { width: 512, height: 288, quality: 70, detail: 'low' as const, approxTokens: 85 },
    // Dashboard: enough resolution to judge small overlay text.
    high: { width: 768, height: 432, quality: 74, detail: 'high' as const, approxTokens: 425 },
}

export type VisionProfile = keyof typeof VISION_PROFILES

export interface CompressedImage {
    dataUrl: string
    bytes: number
    originalBytes: number
    width: number
    height: number
    detail: 'low' | 'high'
    approxTokens: number
    /** sha256 of the compressed bytes; stable cache key for identical uploads. */
    hash: string
}

export async function compressForVision(input: Buffer, profile: VisionProfile): Promise<CompressedImage> {
    const settings = VISION_PROFILES[profile]

    const { data, info } = await sharp(input, { limitInputPixels: 40_000_000, pages: 1 })
        .rotate() // respect EXIF orientation from phone uploads
        .resize({
            width: settings.width,
            height: settings.height,
            fit: 'cover', // thumbnails are 16:9; crop stray letterboxing instead of padding
            position: 'centre',
            withoutEnlargement: true,
        })
        .webp({ quality: settings.quality, effort: 4 })
        .toBuffer({ resolveWithObject: true })

    return {
        dataUrl: `data:image/webp;base64,${data.toString('base64')}`,
        bytes: data.length,
        originalBytes: input.length,
        width: info.width,
        height: info.height,
        detail: settings.detail,
        approxTokens: settings.approxTokens,
        hash: createHash('sha256').update(data).digest('hex'),
    }
}
