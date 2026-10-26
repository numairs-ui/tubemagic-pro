import { supabaseAdmin } from '@/lib/supabase'

/**
 * Two-tier cache: a per-instance memory map in front of the Supabase `api_cache`
 * table. Supabase is the source of truth so the cache is shared by every
 * serverless instance; the memory tier absorbs bursts on a warm instance.
 *
 * The cache fails open: if the table is missing (migration not yet applied) or
 * Supabase errors, the fetcher still runs and the request succeeds uncached.
 */

const memory = new Map<string, { value: unknown; expiresAt: number }>()
const MEMORY_MAX_ENTRIES = 500
let warnedUnavailable = false

function warnOnce(error: unknown) {
    if (warnedUnavailable) return
    warnedUnavailable = true
    console.warn('[cache] api_cache unavailable, serving uncached. Run velocity_suite_migration.sql.', error)
}

function rememberLocally(key: string, value: unknown, expiresAt: number) {
    if (memory.size >= MEMORY_MAX_ENTRIES) {
        const oldest = memory.keys().next().value
        if (oldest !== undefined) memory.delete(oldest)
    }
    memory.set(key, { value, expiresAt })
}

export async function readCache<T>(key: string): Promise<T | null> {
    const local = memory.get(key)
    if (local && local.expiresAt > Date.now()) return local.value as T
    if (local) memory.delete(key)

    const { data, error } = await supabaseAdmin
        .from('api_cache')
        .select('payload, expires_at')
        .eq('cache_key', key)
        .maybeSingle()

    if (error) {
        warnOnce(error)
        return null
    }
    if (!data) return null

    const expiresAt = new Date(data.expires_at).getTime()
    if (expiresAt <= Date.now()) return null

    rememberLocally(key, data.payload, expiresAt)
    return data.payload as T
}

export async function writeCache(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000
    rememberLocally(key, value, expiresAt)

    const { error } = await supabaseAdmin.from('api_cache').upsert({
        cache_key: key,
        payload: value,
        expires_at: new Date(expiresAt).toISOString(),
        created_at: new Date().toISOString(),
    })
    if (error) warnOnce(error)
}

/** Return the cached value for `key`, or run `fetcher` and cache its result. */
export async function cached<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>
): Promise<{ value: T; hit: boolean }> {
    const hit = await readCache<T>(key)
    if (hit !== null) return { value: hit, hit: true }

    const value = await fetcher()
    await writeCache(key, value, ttlSeconds)
    return { value, hit: false }
}
