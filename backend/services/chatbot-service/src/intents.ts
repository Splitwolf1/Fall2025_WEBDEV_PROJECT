export enum ChatIntent {
  TRACK_ORDER = 'track_order',
  TRACK_INSPECTION = 'track_inspection',
  GET_VIOLATIONS = 'get_violations',
  GET_INSPECTIONS = 'get_inspections',
  PRODUCT_INQUIRY = 'product_inquiry',
  PRICING = 'pricing',
  DELIVERY_TIME = 'delivery_time',
  COMPLAINT = 'complaint',
  HELP = 'help',
  GREETING = 'greeting',
  CHAT_WITH_PARTY = 'chat_with_party',
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
      /^ORD-\d+-\d+$/i,  // Standalone order number like ORD-1234567890-0001
      /ORD-\d+-\d+/i,    // Order number anywhere in message
    ],
  },
  [ChatIntent.TRACK_INSPECTION]: {
    keywords: ['inspection', 'ins-'],
    patterns: [
      /view.*inspection/i,
      /inspection.*INS-\d+/i,
      /^INS-\d+$/i,  // Standalone inspection number like INS-702
      /INS-\d+/i,    // Inspection number anywhere in message
      /check.*inspection/i,
    ],
  },
  [ChatIntent.GET_VIOLATIONS]: {
    keywords: ['violation', 'violations', 'non-compliance', 'issues'],
    patterns: [
      /show.*violation/i,
      /recent.*violation/i,
      /list.*violation/i,
      /open.*violation/i,
      /pending.*violation/i,
    ],
  },
  [ChatIntent.GET_INSPECTIONS]: {
    keywords: ['upcoming', 'scheduled', 'expired', 'overdue', 'inspections'],
    patterns: [
      /upcoming.*inspection/i,
      /scheduled.*inspection/i,
      /expired.*inspection/i,
      /overdue.*inspection/i,
      /my.*inspection/i,
      /today.*inspection/i,
      /show.*inspection/i,
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
  [ChatIntent.CHAT_WITH_PARTY]: {
    keywords: ['talk to', 'message', 'contact', 'speak to', 'chat with'],
    patterns: [
      /talk to.*(farmer|distributor|delivery|driver|restaurant|customer|facility owner|owner)/i,
      /message.*(farmer|distributor|delivery|driver|restaurant|customer|facility owner|owner)/i,
      /contact.*(farmer|distributor|delivery|driver|restaurant|customer|facility owner|owner)/i,
      /chat with.*(farmer|distributor|delivery|driver|restaurant|customer|facility owner|owner)/i,
      /speak to.*(farmer|distributor|delivery|driver|restaurant|customer|facility owner|owner)/i,
    ],
  },
  [ChatIntent.UNKNOWN]: {
    keywords: [],
    patterns: [],
  },
};

export const detectIntent = (message: string): ChatIntent => {
  const lowerMessage = message.toLowerCase();

  // Priority 1: Check for "talk to X for ORD-XXX" pattern (CHAT_WITH_PARTY takes precedence)
  const partyWithOrderPattern = /(talk to|message|contact|chat with|speak to).*(farmer|distributor|delivery|driver|restaurant|customer).*ORD-\d+-\d+/i;
  if (partyWithOrderPattern.test(message)) {
    return ChatIntent.CHAT_WITH_PARTY;
  }

  // Priority 2: Check for "talk to facility owner for INS-XXX" pattern
  const facilityOwnerWithInspectionPattern = /(talk to|message|contact|chat with|speak to).*(facility owner|owner).*INS-\d+/i;
  if (facilityOwnerWithInspectionPattern.test(message)) {
    return ChatIntent.CHAT_WITH_PARTY;
  }

  // Priority 3: Check for "talk to X" without order/inspection number
  const partyPattern = /(talk to|message|contact|chat with|speak to).*(farmer|distributor|delivery|driver|restaurant|customer|facility owner|owner|human)/i;
  if (partyPattern.test(message)) {
    return ChatIntent.CHAT_WITH_PARTY;
  }

  // Check patterns (order matters less now since priority cases are handled)
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

export const extractTargetParty = (message: string): string | null => {
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('farmer')) return 'farmer';
  if (lowerMessage.includes('distributor') || lowerMessage.includes('delivery') || lowerMessage.includes('driver')) return 'distributor';
  if (lowerMessage.includes('restaurant') || lowerMessage.includes('customer')) return 'customer';
  return null;
};
