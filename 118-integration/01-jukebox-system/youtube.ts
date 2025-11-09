import { z } from "zod";

// YouTube API response types
export interface YouTubeSearchResult {
  id: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  duration: number;
  publishedAt: string;
}

export interface YouTubeVideoDetails {
  id: string;
  title: string;
  channelTitle: string;
  description: string;
  thumbnailUrl: string;
  duration: number;
  categoryId: string;
  tags: string[];
  viewCount: string;
}

// Validation schemas
const searchResponseSchema = z.object({
  items: z.array(z.object({
    id: z.object({
      videoId: z.string()
    }),
    snippet: z.object({
      title: z.string(),
      channelTitle: z.string(),
      publishedAt: z.string(),
      thumbnails: z.object({
        medium: z.object({
          url: z.string()
        })
      })
    })
  }))
});

const videoDetailsSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    snippet: z.object({
      title: z.string(),
      channelTitle: z.string(),
      description: z.string(),
      publishedAt: z.string(),
      categoryId: z.string(),
      tags: z.array(z.string()).optional(),
      thumbnails: z.object({
        medium: z.object({
          url: z.string()
        })
      })
    }),
    contentDetails: z.object({
      duration: z.string()
    }),
    statistics: z.object({
      viewCount: z.string()
    })
  }))
});

class YouTubeAPI {
  private apiKey: string;
  private baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Parse ISO 8601 duration (PT4M13S) to seconds
  private parseDuration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    return hours * 3600 + minutes * 60 + seconds;
  }

  // Content filtering
  private isContentAppropriate(video: any): boolean {
    // Handle cases where video object might be malformed
    if (!video || typeof video !== 'object') {
      return false;
    }
    
    const title = (video.title || video.snippet?.title || '').toLowerCase();
    const description = (video.description || video.snippet?.description || '').toLowerCase();
    
    const blockedKeywords = [
      'explicit', 'nsfw', '18+', 'nude', 'porn', 'sex',
      'violence', 'hate', 'terror', 'suicide', 'self-harm'
    ];
    
    return !blockedKeywords.some(keyword => 
      title.includes(keyword) || description.includes(keyword)
    );
  }

  // Search for YouTube videos
  async searchVideos(query: string, maxResults: number = 10): Promise<YouTubeSearchResult[]> {
    try {
      const searchUrl = `${this.baseUrl}/search?` + new URLSearchParams({
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: maxResults.toString(),
        videoEmbeddable: 'true',
        videoSyndicated: 'true',
        order: 'relevance',
        key: this.apiKey
      });

      const response = await fetch(searchUrl);
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      const parsedData = searchResponseSchema.parse(data);

      // Get video IDs for detailed info
      const videoIds = parsedData.items.map(item => item.id.videoId);
      const videoDetails = await this.getVideoDetails(videoIds);

      // Filter and transform results
      return videoDetails
        .filter(video => video.duration <= 600) // Max 10 minutes
        .filter(video => this.isContentAppropriate(video))
        .map(video => ({
          id: video.id,
          title: video.title,
          channelTitle: video.channelTitle,
          thumbnailUrl: video.thumbnailUrl,
          duration: video.duration,
          publishedAt: parsedData.items.find(item => item.id.videoId === video.id)?.snippet.publishedAt || ''
        }));

    } catch (error) {
      console.error('YouTube search error:', error);
      throw new Error('Failed to search YouTube videos');
    }
  }

  // Get detailed video information
  async getVideoDetails(videoIds: string[]): Promise<YouTubeVideoDetails[]> {
    try {
      const detailsUrl = `${this.baseUrl}/videos?` + new URLSearchParams({
        part: 'snippet,contentDetails,statistics',
        id: videoIds.join(','),
        key: this.apiKey
      });

      const response = await fetch(detailsUrl);
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      const parsedData = videoDetailsSchema.parse(data);

      return parsedData.items.map(item => ({
        id: item.id,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails.medium.url,
        duration: this.parseDuration(item.contentDetails.duration),
        categoryId: item.snippet.categoryId,
        tags: item.snippet.tags || [],
        viewCount: item.statistics.viewCount
      }));

    } catch (error) {
      console.error('YouTube details error:', error);
      throw new Error('Failed to get video details');
    }
  }

  // Validate a single video for purchase
  async validateVideo(videoId: string): Promise<YouTubeVideoDetails | null> {
    try {
      const videos = await this.getVideoDetails([videoId]);
      const video = videos[0];
      
      if (!video) return null;
      
      // Check all requirements
      if (video.duration > 600) return null; // Max 10 minutes
      if (!this.isContentAppropriate(video)) return null;
      
      return video;
    } catch (error) {
      console.error('Video validation error:', error);
      return null;
    }
  }
}

// Singleton instance
export const youtubeAPI = new YouTubeAPI(process.env.GOOGLE_API_KEY || '');

// Helper functions for routes
export async function searchYouTubeVideos(query: string): Promise<YouTubeSearchResult[]> {
  return await youtubeAPI.searchVideos(query);
}

export async function validateYouTubeVideo(id: string): Promise<YouTubeVideoDetails | null> {
  return await youtubeAPI.validateVideo(id);
}