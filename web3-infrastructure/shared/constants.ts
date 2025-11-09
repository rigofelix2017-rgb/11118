/**
 * Configuration constants
 * NO GAME ENGINE CONSTANTS
 */

// Chat configuration
export const CHAT = {
  MAX_MESSAGE_LENGTH: 500,
  RATE_LIMIT_SECONDS: 2,
  PROXIMITY_RADIUS: 300, // units/pixels for proximity chat
};

// World boundaries (for position validation)
export const WORLD = {
  MIN_X: -10000,
  MAX_X: 10000,
  MIN_Y: -10000,
  MAX_Y: 10000,
};

// Session configuration
export const SESSION = {
  COOKIE_NAME: 'void2_session',
  MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes of inactivity
};

// Database field lengths
export const DB_FIELD_LENGTHS = {
  UUID: 36,
  WALLET_ADDRESS: 42,
  DISPLAY_NAME: 50,
  MESSAGE: 500,
  TRANSACTION_HASH: 66,
};

// Admin wallet addresses (can skip votes, etc)
export const ADMIN_WALLETS = [
  // Add admin wallet addresses here
];

// Jukebox configuration
export const JUKEBOX = {
  MAX_QUEUE_LENGTH: 20,
  SONG_DURATION_MAX: 600, // 10 minutes
  VOTE_SKIP_THRESHOLD: 0.5, // 50% of users
  MIN_VOTES_TO_SKIP: 3,
};

// Rate limiting
export const RATE_LIMITS = {
  CHAT_MESSAGES_PER_MINUTE: 30,
  AUTH_ATTEMPTS_PER_MINUTE: 10,
  MOVE_UPDATES_PER_SECOND: 60,
};
