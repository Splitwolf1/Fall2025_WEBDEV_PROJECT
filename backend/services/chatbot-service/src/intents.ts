export enum ChatIntent {
  TRACK_ORDER = 'track_order',
  PRODUCT_INQUIRY = 'product_inquiry',
  PRICING = 'pricing',
  DELIVERY_TIME = 'delivery_time',
  COMPLAINT = 'complaint',
  HELP = 'help',
  GREETING = 'greeting',
  UNKNOWN = 'unknown',
}

interface IntentPattern {
  keywords: string[];
  patterns: RegExp[];
}

const intentPatterns: Record<ChatIntent, IntentPattern> = {
  [ChatIntent.TRACK_ORDER]: {
    keywords: ['track', 'order', 'status', 'where', 'delivery', 'shipped'],
    patterns: [
      /track.*order/i,
      /order.*status/i,
      /where.*order/i,
      /order.*ORD-\d+/i,
    ],
  },
  [ChatIntent.PRODUCT_INQUIRY]: {
    keywords: ['product', 'available', 'stock', 'have', 'sell'],
    patterns: [
      /do you (have|sell)/i,
      /is.*available/i,
      /in stock/i,
    ],
  },
  [ChatIntent.PRICING]: {
    keywords: ['price', 'cost', 'how much', 'expensive', 'cheap'],
    patterns: [
      /how much/i,
      /what.*price/i,
      /cost.*\?/i,
    ],
  },
  [ChatIntent.DELIVERY_TIME]: {
    keywords: ['delivery', 'arrive', 'eta', 'when', 'time'],
    patterns: [
      /when.*arrive/i,
      /delivery time/i,
      /how long/i,
      /eta/i,
    ],
  },
  [ChatIntent.COMPLAINT]: {
    keywords: ['problem', 'issue', 'wrong', 'bad', 'complaint', 'damaged'],
    patterns: [
      /have.*problem/i,
      /something wrong/i,
      /not.*right/i,
    ],
  },
  [ChatIntent.HELP]: {
    keywords: ['help', 'assist', 'support', 'how to', 'guide'],
    patterns: [
      /need help/i,
      /how (do|can) i/i,
      /help me/i,
    ],
  },
  [ChatIntent.GREETING]: {
    keywords: ['hi', 'hello', 'hey', 'good morning', 'good afternoon'],
    patterns: [
      /^(hi|hello|hey)/i,
      /good (morning|afternoon|evening)/i,
    ],
  },
  [ChatIntent.UNKNOWN]: {
    keywords: [],
    patterns: [],
  },
};

export const detectIntent = (message: string): ChatIntent => {
  const lowerMessage = message.toLowerCase();

  // Check patterns first (more specific)
  for (const [intent, { patterns }] of Object.entries(intentPatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        return intent as ChatIntent;
      }
    }
  }

  // Then check keywords
  for (const [intent, { keywords }] of Object.entries(intentPatterns)) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        return intent as ChatIntent;
      }
    }
  }

  return ChatIntent.UNKNOWN;
};

export const extractOrderNumber = (message: string): string | null => {
  const match = message.match(/ORD-\d+-\d+/i);
  return match ? match[0] : null;
};
