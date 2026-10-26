import { test } from 'node:test'
import assert from 'node:assert/strict'
import sharp from 'sharp'
import { compressForVision } from '../src/lib/image-compress.ts'

async function fakeThumbnail(width: number, height: number) {
    // Noisy pixels so the encoder can't trivially shrink it; closer to a real photo.
    const pixels = Buffer.alloc(width * height * 3)
    for (let i = 0; i < pixels.length; i++) pixels[i] = (i * 2654435761) % 256
    return sharp(pixels, { raw: { width, height, channels: 3 } }).png().toBuffer()
}

test('high profile downsizes a 1280x720 thumbnail to 768x432 WebP', async () => {
    const input = await fakeThumbnail(1280, 720)
    const out = await compressForVision(input, 'high')

    assert.equal(out.width, 768)
    assert.equal(out.height, 432)
    assert.equal(out.detail, 'high')
    assert.ok(out.dataUrl.startsWith('data:image/webp;base64,'))
    assert.ok(out.bytes < out.originalBytes, `${out.bytes} >= ${out.originalBytes}`)
})

test('low profile targets 512x288 for flat-rate low-detail vision', async () => {
    const out = await compressForVision(await fakeThumbnail(1280, 720), 'low')
    assert.equal(out.width, 512)
    assert.equal(out.height, 288)
    assert.equal(out.detail, 'low')
    assert.equal(out.approxTokens, 85)
})

test('small images are not upscaled', async () => {
    const out = await compressForVision(await fakeThumbnail(320, 180), 'high')
    assert.ok(out.width <= 320 && out.height <= 180)
})

test('hash is stable for identical input', async () => {
    const input = await fakeThumbnail(640, 360)
    const [a, b] = await Promise.all([compressForVision(input, 'high'), compressForVision(input, 'high')])
    assert.equal(a.hash, b.hash)
})

test('non-image bytes are rejected', async () => {
    await assert.rejects(compressForVision(Buffer.from('definitely not an image'), 'high'))
})
