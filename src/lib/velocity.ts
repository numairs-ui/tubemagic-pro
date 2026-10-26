// Channel velocity, decay detection and audit scoring.
// Pure functions with no imports so they can be unit-tested with `node --test`.
//
// Raw views-per-day is biased toward new uploads (views front-load in the first
// days), so comparing videos of different ages is misleading. Instead we fit a
// per-channel age curve, views ≈ a · age^b, via least squares in log-log space,
// and score each video against what the channel typically achieves at that age.

export interface VideoInput {
    id: string
    youtube_video_id: string
    title: string
    description?: string | null
    published_at: string
    view_count: number | null
    like_count?: number | null
    comment_count?: number | null
    thumbnail_url?: string | null
}

export interface SnapshotInput {
    youtube_video_id: string
    view_count: number
    captured_at: string
}

export interface AgeCurve {
    a: number
    b: number
    /** False when there were too few videos to fit and a default exponent was used. */
    fitted: boolean
}

export interface VideoPerformance {
    id: string
    youtubeVideoId: string
    title: string
    thumbnailUrl: string | null
    publishedAt: string
    ageDays: number
    views: number
    viewsPerDay: number
    expectedViews: number
    /** actual / expected views at this age. 1.0 = typical for the channel. */
    performanceIndex: number
}

export type RevivalSignal = 'decaying' | 'underperforming'

export interface RevivalCandidate extends VideoPerformance {
    signal: RevivalSignal
    /** Estimated views/month being left on the table. */
    opportunity: number
    recentDailyViews: number | null
    expectedDailyViews: number
    reason: string
}

export interface ChannelVelocity {
    curve: AgeCurve
    videoCount: number
    medianViewsPerDay: number
    uploadCadenceDays: number | null
    daysSinceLastUpload: number | null
    /** % change in median performance index, latest 5 uploads vs the 10 before. */
    momentumPct: number | null
    outliers: VideoPerformance[]
    videos: VideoPerformance[]
    curvePoints: { ageDays: number; expectedViews: number }[]
    revivalCandidates: RevivalCandidate[]
    hasSnapshotHistory: boolean
}

const DAY_MS = 24 * 60 * 60 * 1000
const DEFAULT_EXPONENT = 0.35
const MIN_REVIVAL_AGE_DAYS = 30

export function median(values: number[]): number {
    if (values.length === 0) return 0
    const sorted = [...values].sort((x, y) => x - y)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function ageInDays(publishedAt: string, now: Date): number {
    return Math.max((now.getTime() - new Date(publishedAt).getTime()) / DAY_MS, 0.5)
}

export function fitAgeCurve(points: { ageDays: number; views: number }[]): AgeCurve {
    const usable = points.filter((p) => p.ageDays >= 1 && p.views > 0)

    const withExponent = (b: number): AgeCurve => ({
        a: median(usable.map((p) => p.views / Math.pow(p.ageDays, b))) || 1,
        b,
        fitted: false,
    })

    if (usable.length < 5) return withExponent(DEFAULT_EXPONENT)

    const xs = usable.map((p) => Math.log(p.ageDays))
    const ys = usable.map((p) => Math.log(p.views))
    const meanX = xs.reduce((s, x) => s + x, 0) / xs.length
    const meanY = ys.reduce((s, y) => s + y, 0) / ys.length

    let covariance = 0
    let variance = 0
    for (let i = 0; i < xs.length; i++) {
        covariance += (xs[i] - meanX) * (ys[i] - meanY)
        variance += (xs[i] - meanX) ** 2
    }
    variance /= xs.length
    covariance /= xs.length

    // All uploads within a narrow age band: the slope is noise, keep the default.
    if (variance < 0.05) return withExponent(DEFAULT_EXPONENT)

    // Views should grow sublinearly with age; clamp pathological fits.
    const b = Math.min(Math.max(covariance / variance, 0.05), 1)
    const a = Math.exp(meanY - b * meanX)
    return { a, b, fitted: true }
}

export function expectedViews(curve: AgeCurve, ageDays: number): number {
    return curve.a * Math.pow(Math.max(ageDays, 0.5), curve.b)
}

/** Derivative of the age curve: views/day a typical video gets at this age. */
export function expectedDailyViews(curve: AgeCurve, ageDays: number): number {
    return curve.a * curve.b * Math.pow(Math.max(ageDays, 0.5), curve.b - 1)
}

/** Views/day between the two most recent snapshots at least 2 days apart. */
export function recentDailyViews(snapshots: SnapshotInput[]): number | null {
    if (snapshots.length < 2) return null
    const sorted = [...snapshots].sort((x, y) => new Date(y.captured_at).getTime() - new Date(x.captured_at).getTime())
    const latest = sorted[0]
    const latestTime = new Date(latest.captured_at).getTime()

    const earlier = sorted.find((s) => (latestTime - new Date(s.captured_at).getTime()) / DAY_MS >= 2)
    if (!earlier) return null

    const days = (latestTime - new Date(earlier.captured_at).getTime()) / DAY_MS
    return Math.max(latest.view_count - earlier.view_count, 0) / days
}

function round(value: number, digits = 0): number {
    const factor = 10 ** digits
    const rounded = Math.round(value * factor) / factor
    return rounded === 0 ? 0 : rounded // avoid displaying "-0"
}

export function analyzeChannel(videos: VideoInput[], snapshots: SnapshotInput[] = [], now = new Date()): ChannelVelocity {
    const newestFirst = [...videos].sort(
        (x, y) => new Date(y.published_at).getTime() - new Date(x.published_at).getTime()
    )

    const base = newestFirst.map((v) => {
        const age = ageInDays(v.published_at, now)
        const views = v.view_count || 0
        return { v, age, views }
    })

    const curve = fitAgeCurve(base.map((b) => ({ ageDays: b.age, views: b.views })))

    const performance: VideoPerformance[] = base.map(({ v, age, views }) => {
        const expected = expectedViews(curve, age)
        return {
            id: v.id,
            youtubeVideoId: v.youtube_video_id,
            title: v.title,
            thumbnailUrl: v.thumbnail_url ?? null,
            publishedAt: v.published_at,
            ageDays: round(age, 1),
            views,
            viewsPerDay: round(views / age, 1),
            expectedViews: round(expected),
            performanceIndex: round(expected > 0 ? views / expected : 0, 2),
        }
    })

    // Upload cadence: median gap between consecutive recent uploads.
    const recentDates = newestFirst.slice(0, 20).map((v) => new Date(v.published_at).getTime())
    const gaps = recentDates.slice(1).map((t, i) => (recentDates[i] - t) / DAY_MS)
    const uploadCadenceDays = gaps.length ? round(median(gaps), 1) : null
    const daysSinceLastUpload = newestFirst.length ? round(ageInDays(newestFirst[0].published_at, now), 1) : null

    // Momentum: are recent uploads beating or trailing the channel's established
    // curve? The baseline is fitted WITHOUT the latest uploads; otherwise a run of
    // weak recent videos drags the curve down and hides part of its own decline.
    // Videos under 3 days old are skipped because their index is still volatile.
    const settled = base.filter((b) => b.age >= 3)
    const latestSet = settled.slice(0, 5)
    const previousSet = settled.slice(5, 15)
    let momentumPct: number | null = null
    if (latestSet.length >= 3 && previousSet.length >= 3) {
        const baseline = fitAgeCurve(settled.slice(5).map((b) => ({ ageDays: b.age, views: b.views })))
        const indexOf = (b: (typeof base)[number]) => b.views / expectedViews(baseline, b.age)
        const previousMedian = median(previousSet.map(indexOf))
        if (previousMedian > 0) {
            momentumPct = round((median(latestSet.map(indexOf)) / previousMedian - 1) * 100, 1)
        }
    }

    const outliers = performance
        .filter((p) => p.performanceIndex >= 2 && p.ageDays >= 3)
        .sort((x, y) => y.performanceIndex - x.performanceIndex)
        .slice(0, 5)

    // Revival candidates.
    const snapshotsByVideo = new Map<string, SnapshotInput[]>()
    for (const s of snapshots) {
        const list = snapshotsByVideo.get(s.youtube_video_id) || []
        list.push(s)
        snapshotsByVideo.set(s.youtube_video_id, list)
    }

    const revivalCandidates: RevivalCandidate[] = []
    for (const p of performance) {
        if (p.ageDays < MIN_REVIVAL_AGE_DAYS) continue

        const expectedDaily = expectedDailyViews(curve, p.ageDays)
        const recentDaily = recentDailyViews(snapshotsByVideo.get(p.youtubeVideoId) || [])

        if (recentDaily !== null && expectedDaily > 0 && recentDaily / expectedDaily < 0.5) {
            const ratio = recentDaily / expectedDaily
            revivalCandidates.push({
                ...p,
                signal: 'decaying',
                opportunity: round((expectedDaily - recentDaily) * 30),
                recentDailyViews: round(recentDaily, 1),
                expectedDailyViews: round(expectedDaily, 1),
                reason: `Getting ${round(recentDaily, 1)} views/day vs ~${round(expectedDaily, 1)} typical at this age (${Math.round(ratio * 100)}%). Traffic is fading faster than your catalog norm.`,
            })
        } else if (p.performanceIndex < 0.6) {
            revivalCandidates.push({
                ...p,
                signal: 'underperforming',
                opportunity: round(Math.max(expectedDaily * 30 * (1 - p.performanceIndex), 0)),
                recentDailyViews: recentDaily === null ? null : round(recentDaily, 1),
                expectedDailyViews: round(expectedDaily, 1),
                reason: `Has ${Math.round(p.performanceIndex * 100)}% of the views your videos usually have at ${Math.round(p.ageDays)} days. The packaging (title + thumbnail) is the most likely bottleneck.`,
            })
        }
    }
    revivalCandidates.sort((x, y) => y.opportunity - x.opportunity)

    // Expected-views curve sampled on a log scale for charting.
    const maxAge = Math.max(...performance.map((p) => p.ageDays), 2)
    const curvePoints = Array.from({ length: 30 }, (_, i) => {
        const ageDays = Math.exp((Math.log(maxAge) * i) / 29)
        return { ageDays: round(ageDays, 1), expectedViews: round(expectedViews(curve, ageDays)) }
    })

    return {
        curve,
        videoCount: performance.length,
        medianViewsPerDay: round(median(performance.slice(0, 10).map((p) => p.viewsPerDay)), 1),
        uploadCadenceDays,
        daysSinceLastUpload,
        momentumPct,
        outliers,
        videos: performance,
        curvePoints,
        revivalCandidates: revivalCandidates.slice(0, 12),
        hasSnapshotHistory: snapshots.length > 0,
    }
}

export type IssuePriority = 'Critical' | 'High' | 'Medium' | 'Low'

export interface AuditIssue {
    priority: IssuePriority
    check: string
    tip: string
}

export interface ChannelAudit {
    score: number
    issues: AuditIssue[]
    passed: string[]
    total_videos: number
}

const PRIORITY_ORDER: Record<IssuePriority, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }

/** 10-point channel health audit, 10 points per passed check. */
export function runChannelAudit(videos: VideoInput[], velocity: ChannelVelocity): ChannelAudit {
    const issues: AuditIssue[] = []
    const passed: string[] = []
    const total = videos.length
    const share = (count: number) => (total ? count / total : 0)

    const check = (ok: boolean, pass: string, issue: AuditIssue) => {
        if (ok) passed.push(pass)
        else issues.push(issue)
    }

    check(
        velocity.daysSinceLastUpload !== null && velocity.daysSinceLastUpload <= 30,
        "Consistency: You've uploaded in the last 30 days.",
        { priority: 'High', check: 'Consistency', tip: 'Upload at least once a month. Long gaps reset the algorithm’s audience signals.' }
    )

    check(
        velocity.uploadCadenceDays !== null && velocity.uploadCadenceDays <= 14,
        `Cadence: A new video every ~${velocity.uploadCadenceDays ?? '?'} days.`,
        {
            priority: 'Medium',
            check: 'Upload Cadence',
            tip: `Your median gap between uploads is ${velocity.uploadCadenceDays ?? 'unknown'} days. Aim for 14 or fewer, and repurpose long-form into Shorts to fill gaps.`,
        }
    )

    check(
        velocity.momentumPct !== null && velocity.momentumPct >= -10,
        `Momentum: Recent uploads are ${velocity.momentumPct !== null && velocity.momentumPct >= 0 ? 'beating' : 'holding near'} your catalog norm (${velocity.momentumPct ?? 0}%).`,
        velocity.momentumPct === null
            ? { priority: 'Low', check: 'Momentum', tip: 'Not enough settled uploads yet to measure momentum. Keep publishing and re-run the audit.' }
            : {
                priority: 'High',
                check: 'Momentum',
                tip: `Your latest 5 uploads perform ${Math.abs(velocity.momentumPct)}% below the 10 before them. Grade titles and thumbnails in Packaging Studio before publishing.`,
            }
    )

    const underperformers = velocity.videos.filter((p) => p.ageDays >= 7 && p.performanceIndex < 0.5).length
    check(
        share(underperformers) <= 0.3,
        'Packaging: Most videos perform at or above your channel baseline.',
        {
            priority: 'High',
            check: 'Packaging Consistency',
            tip: `${underperformers} videos get less than half your typical views for their age. Open Video Revival to repackage them.`,
        }
    )

    const avgDescLen = total ? videos.reduce((acc, v) => acc + (v.description?.length || 0), 0) / total : 0
    check(avgDescLen > 500, 'Depth: Descriptions are detailed and SEO-rich.', {
        priority: 'Medium',
        check: 'Description Depth',
        tip: 'Descriptions are too short. Aim for 200+ words with your target keyword in the first two lines.',
    })

    const withHashtags = videos.filter((v) => v.description?.includes('#')).length
    check(share(withHashtags) >= 0.7, 'Discoverability: Hashtags are used consistently.', {
        priority: 'Low',
        check: 'Hashtags',
        tip: 'Add 3-5 relevant hashtags to every video description.',
    })

    const optimalTitles = videos.filter((v) => v.title.length >= 30 && v.title.length <= 70).length
    check(share(optimalTitles) > 0.7, 'Titles: Lengths fit without truncation on mobile.', {
        priority: 'High',
        check: 'Title Length',
        tip: 'Keep titles between 30 and 70 characters so the hook is not cut off in mobile feeds.',
    })

    const totalViews = videos.reduce((acc, v) => acc + (v.view_count || 0), 0)
    const totalLikes = videos.reduce((acc, v) => acc + (v.like_count || 0), 0)
    const engagement = totalViews > 0 ? (totalLikes / totalViews) * 100 : 0
    check(engagement >= 3, `Engagement: Healthy like rate (${engagement.toFixed(1)}%).`, {
        priority: 'Medium',
        check: 'Engagement',
        tip: `Like rate is ${engagement.toFixed(1)}%. Ask a specific question early in the video to prompt comments and likes.`,
    })

    const intent = videos.filter((v) => /how to|tutorial|guide|review|best|vs\.?|explained/i.test(v.title)).length
    check(share(intent) > 0.3, 'Intent: Titles target searchable intent.', {
        priority: 'Medium',
        check: 'Search Intent',
        tip: 'Mix in searchable formats ("how to", "vs", "explained") so videos keep earning search traffic after launch.',
    })

    const withLinks = videos.filter((v) => v.description?.includes('http')).length
    check(share(withLinks) > 0.8, 'Conversion: Descriptions link out to your offers or socials.', {
        priority: 'Low',
        check: 'Call to Action',
        tip: 'Add links to your products, newsletter or related videos in every description.',
    })

    return {
        score: passed.length * 10,
        issues: issues.sort((x, y) => PRIORITY_ORDER[x.priority] - PRIORITY_ORDER[y.priority]),
        passed,
        total_videos: total,
    }
}
