import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, errorResponse, parseBody, requireUserId } from "@/lib/api";
import { getOwnedChannel } from "@/lib/account";
import { getChannelVelocity } from "@/lib/channel-sync";
import { runChannelAudit } from "@/lib/velocity";

const bodySchema = z.object({ channelId: z.string().uuid().optional() });

/** Channel Velocity Audit: 10 health checks plus velocity and momentum metrics. */
export async function POST(req: Request) {
    try {
        const userId = await requireUserId();
        const body = await parseBody(req, bodySchema);
        const channel = await getOwnedChannel(userId, body.channelId);

        const { videos, velocity } = await getChannelVelocity(channel);
        if (videos.length === 0) {
            throw new ApiError(400, "no_videos", "No videos found to audit. Your channel may still be syncing.");
        }

        const audit = runChannelAudit(videos, velocity);

        return NextResponse.json({
            ...audit,
            channel: { id: channel.id, name: channel.channel_name },
            velocity: {
                medianViewsPerDay: velocity.medianViewsPerDay,
                uploadCadenceDays: velocity.uploadCadenceDays,
                daysSinceLastUpload: velocity.daysSinceLastUpload,
                momentumPct: velocity.momentumPct,
                curveFitted: velocity.curve.fitted,
                outliers: velocity.outliers,
                revivalCount: velocity.revivalCandidates.length,
                videos: velocity.videos,
                curvePoints: velocity.curvePoints,
            },
        });
    } catch (error) {
        return errorResponse(error, "seo/audit");
    }
}
