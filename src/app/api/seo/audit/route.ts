import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Get Channel
        const { data: user } = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("clerk_user_id", userId)
            .single();

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const { data: channel } = await supabaseAdmin
            .from("channels")
            .select("*")
            .eq("user_id", user.id)
            .single();

        if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });

        // 2. Get Last 50 Videos
        const { data: videos } = await supabaseAdmin
            .from("videos")
            .select("*")
            .eq("channel_id", channel.id)
            .order("published_at", { ascending: false })
            .limit(50);

        if (!videos || videos.length === 0) {
            return NextResponse.json({ error: "No videos found to audit." }, { status: 400 });
        }

        // 3. Run 10-Point Audit
        let score = 0;
        const issues = [];
        const passed = [];

        // Check 1: Upload Consistency (Are there videos in the last 30 days?)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentUploads = videos.filter(v => new Date(v.published_at) > thirtyDaysAgo);

        if (recentUploads.length >= 1) {
            score += 10;
            passed.push("Consistency: You've uploaded recently.");
        } else {
            issues.push({ priority: "High", check: "Consistency", tip: "Upload at least once a month to maintain momentum." });
        }

        // Check 2: Description Depth (>200 words approx 1000 chars)
        const avgDescLen = videos.reduce((acc, v) => acc + (v.description?.length || 0), 0) / videos.length;
        if (avgDescLen > 500) { // Lowered threshold slightly for realism
            score += 10;
            passed.push("Depth: Descriptions are detailed and SEO-rich.");
        } else {
            issues.push({ priority: "Medium", check: "Description Depth", tip: "Descriptions are too short. Aim for 200+ words." });
        }

        // Check 3: Tag Utilization (Do most videos have tags?)
        // Assuming 'tags' column exists and is specific to video details which might not be in the 'videos' table summary 
        // If tags are missing from DB schema, we might skip or check description for hashtags
        // For now, let's assume we check if description contains hashtags #
        const hasHashtags = videos.every(v => v.description?.includes("#"));
        if (hasHashtags) {
            score += 10;
            passed.push("Discoverability: Hashtags are being used.");
        } else {
            issues.push({ priority: "Medium", check: "Hashtags", tip: "Add 3-5 hashtags to every video description." });
        }

        // Check 4: Title Length (Optimal 50-60 chars)
        const optimalTitles = videos.filter(v => v.title.length >= 30 && v.title.length <= 70).length;
        if (optimalTitles / videos.length > 0.7) {
            score += 10;
            passed.push("Titles: Optimized for click-through rate.");
        } else {
            issues.push({ priority: "High", check: "Title Optimization", tip: "Keep titles between 30-70 characters. Avoid truncation." });
        }

        // Check 5: Engagement Rate (Likes / Views > 3% is good standard)
        const totalViews = videos.reduce((acc, v) => acc + (v.view_count || 0), 0);
        const totalLikes = videos.reduce((acc, v) => acc + (v.like_count || 0), 0);
        const engagement = totalViews > 0 ? (totalLikes / totalViews) * 100 : 0;

        if (engagement > 3.5) {
            score += 10;
            passed.push(`Engagement: Excellent audience response (${engagement.toFixed(1)}%).`);
        } else {
            issues.push({ priority: "High", check: "Engagement", tip: `Engagement is low (${engagement.toFixed(1)}%). Ask viewers to like/comment explicitly.` });
        }

        // Check 6: Custom Thumbnails (Check for high res URL availability)
        const highResThumbs = videos.filter(v => v.thumbnail_url?.includes("maxresdefault"));
        // Since we store generic thumbnail_url in DB, this might be tricky. 
        // Let's check consistency of thumbnail presence instead.
        if (videos.every(v => v.thumbnail_url)) {
            score += 10;
            passed.push("Visuals: All videos have thumbnails.");
        } else {
            issues.push({ priority: "Critical", check: "Thumbnails", tip: "Some videos are missing thumbnails." });
        }

        // Check 7: Comment Response
        // If comment_count > 0, we can't easily check if CREATOR replied without more API calls.
        // Let's swap for "Keyword Focus" in titles
        const keywordFocus = videos.filter(v => v.title.match(/how to|tutorial|guide|review|best/i)).length;
        if (keywordFocus / videos.length > 0.3) {
            score += 10;
            passed.push("Intent: High search intent keywords found.");
        } else {
            issues.push({ priority: "High", check: "Search Intent", tip: "Use more discoverable keywords like 'How to' or 'Review'." });
        }

        // Check 8: Link Usage (Call to Action)
        const hasLinks = videos.filter(v => v.description?.includes("http")).length;
        if (hasLinks / videos.length > 0.8) {
            score += 10;
            passed.push("Conversion: Strong use of external links.");
        } else {
            issues.push({ priority: "Low", check: "Call to Action", tip: "Add links to your products or socials in descriptions." });
        }

        // Check 9: Playlist Usage (Proxy: Do videos link to other videos?)
        // Hard to check without playlist API. Let's use View Velocity (Views per day)
        const recentVideo = videos[0];
        const daysSince = (new Date().getTime() - new Date(recentVideo.published_at).getTime()) / (1000 * 3600 * 24);
        const velocity = recentVideo.view_count / (daysSince || 1);

        if (velocity > 5) { // Arbitrary low threshold for "alive"
            score += 10;
            passed.push("Velocity: New videos are getting immediate traction.");
        } else {
            issues.push({ priority: "Medium", check: "Velocity", tip: "Initial traction is low. Promote new videos on community tab." });
        }

        // Check 10: "Hook" Effectiveness (Title CAPS or Numbers)
        const hooks = videos.filter(v => v.title.match(/[0-9]|!|\?|SECRET|HACK/)).length;
        if (hooks / videos.length > 0.5) {
            score += 10;
            passed.push("Psychology: Titles use psychological hooks (numbers, caps).");
        } else {
            issues.push({ priority: "Low", check: "Click Psychology", tip: "Use numbers or emotional triggers in titles." });
        }

        return NextResponse.json({
            score,
            issues: issues.sort((a, b) => a.priority === 'Critical' ? -1 : 1),
            passed,
            total_videos: videos.length
        });

    } catch (error) {
        console.error("Audit Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
