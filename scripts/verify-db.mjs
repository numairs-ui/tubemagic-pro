// Read-only migration check. Confirms every table, column and function the app
// needs exists, without reading or writing any row data.
//
//   node --env-file=.env.local scripts/verify-db.mjs
//
// Exit code 0 = all present, 1 = something missing (output says which migration to run).
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}
const db = createClient(url, key, { auth: { persistSession: false } })

// [table, columns, migration that creates them]
const TABLES = [
    ['users', 'id, clerk_user_id, email', 'base_schema_migration.sql'],
    ['channels', 'id, user_id, youtube_channel_id, niche, last_synced_at', 'base_schema_migration.sql'],
    ['videos', 'id, channel_id, youtube_video_id, title, view_count, published_at', 'base_schema_migration.sql'],
    ['competitors', 'id, channel_id, competitor_channel_id', 'supabase_migration.sql'],
    ['video_ideas', 'id', 'supabase_migration.sql'],
    ['optimizations', 'id', 'supabase_migration.sql'],
    ['users', 'plan, stripe_customer_id, stripe_subscription_id, email_notifications', 'settings_migration.sql'],
    ['users', 'subscription_status, current_period_end', 'velocity_suite_migration.sql'],
    ['api_cache', 'cache_key, payload, expires_at', 'velocity_suite_migration.sql'],
    ['youtube_quota_usage', 'usage_date, units_used', 'velocity_suite_migration.sql'],
    ['rate_limits', 'bucket_key, window_start, hits', 'velocity_suite_migration.sql'],
    ['ai_usage', 'user_key, feature, prompt_tokens, completion_tokens', 'velocity_suite_migration.sql'],
    ['vision_evaluations', 'id, cache_key, clerk_user_id, source, result', 'velocity_suite_migration.sql'],
    ['grader_leads', 'id, email, evaluation_id', 'velocity_suite_migration.sql'],
    ['video_stats_snapshots', 'youtube_video_id, view_count, captured_at', 'velocity_suite_migration.sql'],
    ['stripe_events', 'id, type', 'velocity_suite_migration.sql'],
]

// Distinguish "can't reach Supabase" from "table missing" so the advice is right.
const probe = await db.from('users').select('id').limit(0)
if (probe.error && /fetch failed|ENOTFOUND|ECONNREFUSED|timeout/i.test(probe.error.message)) {
    console.error(`Cannot reach Supabase at ${new URL(url).host}: ${probe.error.message}`)
    console.error('Check your network, and whether the Supabase project is paused (free projects pause after inactivity).')
    process.exit(2)
}

let missing = 0
const report = (ok, label, detail = '') => {
    if (!ok) missing++
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`)
}

for (const [table, columns, migration] of TABLES) {
    // limit(0) returns no rows; it only proves the table and columns resolve.
    const { error } = await db.from(table).select(columns).limit(0)
    report(!error, `${table}: ${columns}`, error ? `${error.message} -> run ${migration}` : '')
}

// ai_tokens_used_since is STABLE (read-only), so calling it is side-effect free.
// The other velocity functions mutate state, so they are checked via the
// table they depend on above rather than invoked here.
const { error: fnError } = await db.rpc('ai_tokens_used_since', { p_user_key: null, p_since: new Date().toISOString() })
report(!fnError, 'function ai_tokens_used_since', fnError ? `${fnError.message} -> run velocity_suite_migration.sql` : '')

console.log(missing ? `\n${missing} check(s) failed.` : '\nAll migrations verified.')
process.exit(missing ? 1 : 0)
