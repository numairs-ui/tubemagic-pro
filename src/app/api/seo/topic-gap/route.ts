import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { google } from "googleapis";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const youtube = google.youtube({
    version: "v3",
    auth: process.env.YOUTUBE_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Get User's Channel
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

        // 2. Get Competitors
        const { data: competitors } = await supabaseAdmin
            .from("competitors")
            .select("competitor_channel_id, competitor_name")
            .eq("channel_id", channel.id);

        if (!competitors || competitors.length === 0) {
            return NextResponse.json({ error: "No competitors found. Add competitors first." }, { status: 400 });
        }

        // 3. Get User's Recent Video Titles (Context for what they HAVE covered)
        const { data: userVideos } = await supabaseAdmin
            .from("videos")
            .select("title")
            .eq("channel_id", channel.id)
            .order("published_at", { ascending: false })
            .limit(30);

        const userTitles = userVideos?.map((v) => v.title) || [];

        // 4. Fetch Top Videos from Competitors via YouTube API
        const competitorContent = [];

        for (const comp of competitors) {
            try {
                const response = await youtube.search.list({
                    part: ["snippet"],
                    channelId: comp.competitor_channel_id,
                    order: "viewCount", // Most popular
                    maxResults: 15, // Top 15 videos
                    type: ["video"],
                });

                const videos = response.data.items?.map((item) => ({
                    title: item.snippet?.title,
                    channel: comp.competitor_name,
                    publishedAt: item.snippet?.publishedAt,
                }));

                if (videos) {
                    competitorContent.push(...videos);
                }
            } catch (error) {
                console.error(`Error fetching for ${comp.competitor_name}:`, error);
            }
        }

        // 5. AI Gap Analysis
        const prompt = `
      You are a YouTube Strategy Expert. 
      
      My Channel Niche: Tech/Coding (Inferred)
      My Recent Topics: ${JSON.stringify(userTitles.slice(0, 20))}
      
      Competitor High-Performance Videos:
      ${JSON.stringify(competitorContent.slice(0, 50))}

      Task: Identify 5 "Content Gaps" - topics that are working huge for my competitors but I haven't covered well (or at all).
      
      Return JSON format:
      {
        "gaps": [
          {
            "topic": "Title of the topic",
            "search_volume_potential": "High/Medium",
            "competitor_proof": "Video X by Channel Y had huge views",
            "strategy_tip": "How I should approach this topic differently or better"
          }
        ]
      }
    `;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4-turbo-preview",
            response_format: { type: "json_object" },
        });

        const analysis = JSON.parse(completion.choices[0].message.content || "{}");

        return NextResponse.json(analysis);

    } catch (error) {
        console.error("Gap Analysis Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
