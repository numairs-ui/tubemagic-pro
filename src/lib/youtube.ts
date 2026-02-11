import { google } from 'googleapis'

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
})

export async function getChannelData(identifier: string) {
  const isHandle = identifier.startsWith('@');

  const response = await youtube.channels.list({
    part: ['snippet', 'statistics', 'contentDetails'],
    id: isHandle ? undefined : [identifier],
    forHandle: isHandle ? identifier : undefined,
  })

  const channel = response.data.items?.[0]
  if (!channel) throw new Error('Channel not found. Make sure the ID or @handle is correct.')

  return {
    id: channel.id!,
    name: channel.snippet!.title!,
    description: channel.snippet!.description!,
    thumbnailUrl: channel.snippet!.thumbnails!.high!.url!,
    subscriberCount: parseInt(channel.statistics!.subscriberCount!),
    viewCount: parseInt(channel.statistics!.viewCount!),
    videoCount: parseInt(channel.statistics!.videoCount!),
  }
}

/**
 * Extracts the channel ID or handle from various YouTube URL formats
 * Supports: 
 * - https://youtube.com/@handle
 * - https://youtube.com/channel/UC...
 * - UC... (Direct ID)
 * - @handle (Direct handle)
 */
export function extractChannelIdOrHandle(input: string): string {
  const trimmed = input.trim();

  // 1. Handle full URLs
  try {
    if (trimmed.includes('youtube.com/')) {
      const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);

      // Handle @handle format
      if (url.pathname.startsWith('/@')) {
        return url.pathname.substring(1); // Ex: @NumairShahzada
      }

      // Handle /channel/UC... format
      if (url.pathname.startsWith('/channel/')) {
        return url.pathname.split('/')[2];
      }
    }
  } catch (e) {
    // If URL parsing fails, continue to raw check
  }

  // 2. Handle direct inputs
  // If it's a UC... ID or starts with @, return as is
  if (trimmed.startsWith('UC') || trimmed.startsWith('@')) {
    return trimmed;
  }

  return trimmed;
}

export async function searchChannels(query: string, maxResults = 5) {
  const response = await youtube.search.list({
    part: ['snippet'],
    q: query,
    type: ['channel'],
    maxResults,
  })

  return response.data.items?.map((item) => ({
    id: item.snippet!.channelId!,
    name: item.snippet!.title!,
    description: item.snippet!.description!,
    thumbnailUrl: item.snippet!.thumbnails!.high!.url!,
  })) || []
}

export async function getChannelVideos(channelId: string, maxResults = 50) {
  const response = await youtube.search.list({
    part: ['snippet'],
    channelId,
    order: 'date',
    maxResults,
    type: ['video'],
  })

  return response.data.items?.map((item) => ({
    videoId: item.id!.videoId!,
    title: item.snippet!.title!,
    description: item.snippet!.description!,
    publishedAt: item.snippet!.publishedAt!,
    thumbnailUrl: item.snippet!.thumbnails!.high!.url!,
  })) || []
}

export async function getVideoStats(videoId: string) {
  const response = await youtube.videos.list({
    part: ['statistics', 'contentDetails', 'snippet'],
    id: [videoId],
  })

  const video = response.data.items?.[0]
  if (!video) throw new Error('Video not found')

  return {
    viewCount: parseInt(video.statistics!.viewCount || '0'),
    likeCount: parseInt(video.statistics!.likeCount || '0'),
    commentCount: parseInt(video.statistics!.commentCount || '0'),
    duration: video.contentDetails!.duration!,
    tags: video.snippet!.tags || [],
  }
}
