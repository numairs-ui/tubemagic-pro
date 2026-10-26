import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
    analyzeChannel,
    expectedViews,
    fitAgeCurve,
    median,
    recentDailyViews,
    runChannelAudit,
    type VideoInput,
} from '../src/lib/velocity.ts'

const NOW = new Date('2026-10-01T00:00:00Z')
const DAY = 86_400_000

function video(i: number, ageDays: number, views: number, extra: Partial<VideoInput> = {}): VideoInput {
    return {
        id: `v${i}`,
        youtube_video_id: `yt${i}`,
        title: `How to ship feature number ${i} in Next.js`,
        description: 'A long description '.repeat(40) + ' #nextjs https://example.com',
        published_at: new Date(NOW.getTime() - ageDays * DAY).toISOString(),
        view_count: views,
        like_count: Math.round(views * 0.04),
        ...extra,
    }
}

/** A channel whose videos follow views = 1000 * age^0.4 exactly. */
function idealChannel(count = 20, gapDays = 7) {
    return Array.from({ length: count }, (_, i) => {
        const age = 2 + i * gapDays
        return video(i, age, Math.round(1000 * Math.pow(age, 0.4)))
    })
}

test('median handles odd, even and empty input', () => {
    assert.equal(median([3, 1, 2]), 2)
    assert.equal(median([4, 1, 3, 2]), 2.5)
    assert.equal(median([]), 0)
})

test('fitAgeCurve recovers the exponent of a power-law catalog', () => {
    const points = [1, 3, 10, 30, 100, 300].map((age) => ({ ageDays: age, views: 500 * Math.pow(age, 0.5) }))
    const curve = fitAgeCurve(points)
    assert.equal(curve.fitted, true)
    assert.ok(Math.abs(curve.b - 0.5) < 0.01, `b=${curve.b}`)
    assert.ok(Math.abs(curve.a - 500) / 500 < 0.02, `a=${curve.a}`)
})

test('fitAgeCurve falls back to a default exponent with too few videos', () => {
    const curve = fitAgeCurve([{ ageDays: 5, views: 100 }, { ageDays: 10, views: 200 }])
    assert.equal(curve.fitted, false)
    assert.ok(curve.a > 0)
})

test('fitAgeCurve clamps pathological slopes', () => {
    // Views falling with age would imply a negative exponent.
    const points = [1, 5, 20, 60, 120].map((age, i) => ({ ageDays: age, views: 10_000 / (i + 1) ** 3 }))
    assert.ok(fitAgeCurve(points).b >= 0.05)
})

test('analyzeChannel scores an on-curve catalog near index 1.0', () => {
    const result = analyzeChannel(idealChannel(), [], NOW)
    for (const v of result.videos) {
        assert.ok(Math.abs(v.performanceIndex - 1) < 0.05, `${v.title}: ${v.performanceIndex}`)
    }
    assert.equal(result.uploadCadenceDays, 7)
    assert.equal(result.revivalCandidates.length, 0)
    assert.equal(result.momentumPct, 0)
})

test('analyzeChannel flags an old underperformer for revival', () => {
    const videos = idealChannel()
    const target = videos[10] // ~72 days old
    target.view_count = Math.round((target.view_count || 0) * 0.3)

    const result = analyzeChannel(videos, [], NOW)
    const candidate = result.revivalCandidates.find((c) => c.id === target.id)
    assert.ok(candidate, 'expected the throttled video to be a candidate')
    assert.equal(candidate.signal, 'underperforming')
    assert.ok(candidate.opportunity > 0)
})

test('analyzeChannel ignores young videos for revival', () => {
    const videos = idealChannel()
    videos[0].view_count = 1 // 2 days old, terrible, but too young to judge
    const result = analyzeChannel(videos, [], NOW)
    assert.equal(result.revivalCandidates.some((c) => c.id === videos[0].id), false)
})

test('snapshots that show stalled traffic mark a video as decaying', () => {
    const videos = idealChannel()
    const target = videos[12]
    const snapshots = [
        { youtube_video_id: target.youtube_video_id, view_count: target.view_count!, captured_at: NOW.toISOString() },
        {
            youtube_video_id: target.youtube_video_id,
            view_count: target.view_count! - 1, // ~0.14 views/day over 7 days
            captured_at: new Date(NOW.getTime() - 7 * DAY).toISOString(),
        },
    ]
    const result = analyzeChannel(videos, snapshots, NOW)
    const candidate = result.revivalCandidates.find((c) => c.id === target.id)
    assert.ok(candidate)
    assert.equal(candidate.signal, 'decaying')
    assert.equal(result.hasSnapshotHistory, true)
})

test('recentDailyViews needs snapshots at least 2 days apart', () => {
    const at = (days: number, views: number) => ({
        youtube_video_id: 'x',
        view_count: views,
        captured_at: new Date(NOW.getTime() - days * DAY).toISOString(),
    })
    assert.equal(recentDailyViews([at(0, 100)]), null)
    assert.equal(recentDailyViews([at(0, 100), at(1, 90)]), null)
    assert.equal(recentDailyViews([at(0, 100), at(1, 90), at(4, 60)]), 10)
})

test('momentum detects recent uploads underperforming older ones', () => {
    const videos = idealChannel()
    for (const v of videos.slice(0, 5)) v.view_count = Math.round((v.view_count || 0) * 0.5)
    const result = analyzeChannel(videos, [], NOW)
    assert.ok(result.momentumPct !== null && result.momentumPct < -30, `momentum=${result.momentumPct}`)
})

test('runChannelAudit awards 10 points per passed check and sorts issues', () => {
    const videos = idealChannel()
    const audit = runChannelAudit(videos, analyzeChannel(videos, [], NOW))
    assert.equal(audit.score, audit.passed.length * 10)
    assert.equal(audit.passed.length + audit.issues.length, 10)
    assert.equal(audit.total_videos, 20)

    const order = { Critical: 0, High: 1, Medium: 2, Low: 3 }
    for (let i = 1; i < audit.issues.length; i++) {
        assert.ok(order[audit.issues[i - 1].priority] <= order[audit.issues[i].priority])
    }
})

test('expectedViews is monotonic in age', () => {
    const curve = { a: 100, b: 0.4, fitted: true }
    assert.ok(expectedViews(curve, 10) < expectedViews(curve, 100))
})
