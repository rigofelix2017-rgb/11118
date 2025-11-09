// API Validation Schemas using Zod
import { z } from 'zod';

// Achievement Schemas
export const claimAchievementSchema = z.object({
  achievementId: z.string().min(1, 'Achievement ID required'),
});

// Quest Schemas
export const claimQuestSchema = z.object({
  questId: z.string().min(1, 'Quest ID required'),
});

// Trading Schemas
export const createTradeSchema = z.object({
  partnerId: z.string().min(1, 'Partner ID required'),
  items: z.array(
    z.object({
      itemId: z.string(),
      quantity: z.number().positive(),
    })
  ).min(1, 'At least one item required'),
});

export const tradeActionSchema = z.object({
  tradeId: z.string().min(1, 'Trade ID required'),
});

// Party Schemas
export const createPartySchema = z.object({
  name: z.string().min(1).max(50),
  isPublic: z.boolean().optional(),
});

export const joinPartySchema = z.object({
  partyId: z.string().min(1, 'Party ID required'),
});

export const kickMemberSchema = z.object({
  memberId: z.string().min(1, 'Member ID required'),
});

// Crafting Schemas
export const craftItemSchema = z.object({
  recipeId: z.string().min(1, 'Recipe ID required'),
  quantity: z.number().positive().optional().default(1),
});

export const collectCraftedSchema = z.object({
  queueId: z.string().min(1, 'Queue ID required'),
});

// Auction Schemas
export const createAuctionSchema = z.object({
  itemId: z.string().min(1, 'Item ID required'),
  startBid: z.number().positive('Start bid must be positive'),
  buyNowPrice: z.number().positive().optional(),
  duration: z.enum(['6', '12', '24', '48', '72']).transform(Number),
});

export const placeBidSchema = z.object({
  auctionId: z.string().min(1, 'Auction ID required'),
  amount: z.number().positive('Bid amount must be positive'),
  isAutoBid: z.boolean().optional(),
  maxBid: z.number().positive().optional(),
});

export const buyNowSchema = z.object({
  auctionId: z.string().min(1, 'Auction ID required'),
});

// Bank Schemas
export const depositItemSchema = z.object({
  itemId: z.string().min(1, 'Item ID required'),
  quantity: z.number().positive(),
  isShared: z.boolean().optional().default(false),
});

export const withdrawItemSchema = z.object({
  vaultItemId: z.string().min(1, 'Vault item ID required'),
  quantity: z.number().positive(),
});

export const depositVoidSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
});

export const withdrawVoidSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
});

// Emote Schemas
export const setFavoriteEmoteSchema = z.object({
  slot: z.number().min(1).max(8),
  emoteId: z.string().optional(),
});

export const useEmoteSchema = z.object({
  emoteId: z.string().min(1, 'Emote ID required'),
});

// Photo Schemas
export const capturePhotoSchema = z.object({
  imageData: z.string().min(1, 'Image data required'),
  settings: z.object({
    filter: z.string(),
    frame: z.string(),
    fov: z.number().min(40).max(120),
  }),
  isPublic: z.boolean().optional().default(true),
});

export const mintNFTSchema = z.object({
  photoId: z.string().min(1, 'Photo ID required'),
});

// Event Schemas
export const createEventSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500),
  category: z.enum(['social', 'raid', 'pvp', 'contest', 'concert', 'market', 'other']),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  location: z.string(),
  maxAttendees: z.number().positive().optional(),
  isRecurring: z.boolean().optional().default(false),
  recurringType: z.enum(['daily', 'weekly', 'monthly']).optional(),
});

export const rsvpSchema = z.object({
  eventId: z.string().min(1, 'Event ID required'),
  status: z.enum(['going', 'maybe', 'not-going']),
});

export const reminderSchema = z.object({
  eventId: z.string().min(1, 'Event ID required'),
  reminderTime: z.number().positive(),
});

// Helper function to validate request body
export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        data: null,
        error: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
    }
    return { data: null, error: 'Invalid request data' };
  }
}
