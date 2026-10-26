// Browser-side pre-compression for thumbnail uploads. Shrinking to 1280px WebP
// before upload keeps request bodies far below Vercel's 4.5 MB limit and makes
// uploads fast on mobile; the server then compresses again for the Vision API.

const MAX_WIDTH = 1280
const MAX_HEIGHT = 720
const MAX_INPUT_BYTES = 15 * 1024 * 1024

export async function fileToCompressedDataUrl(file: File): Promise<string> {
    if (!file.type.startsWith("image/")) throw new Error("Choose an image file (PNG, JPG or WebP).")
    if (file.size > MAX_INPUT_BYTES) throw new Error("That image is over 15 MB. Export a smaller version.")

    const bitmap = await createImageBitmap(file).catch(() => {
        throw new Error("This image could not be read. Try a PNG or JPG.")
    })

    const scale = Math.min(1, MAX_WIDTH / bitmap.width, MAX_HEIGHT / bitmap.height)
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Your browser could not process this image.")
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    // Safari < 17 cannot encode WebP and silently returns PNG; fall back to JPEG.
    const webp = canvas.toDataURL("image/webp", 0.85)
    return webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/jpeg", 0.85)
}
