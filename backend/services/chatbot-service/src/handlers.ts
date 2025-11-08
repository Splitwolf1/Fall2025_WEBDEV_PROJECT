import { ChatIntent, extractOrderNumber } from './intents';

export interface ChatResponse {
  text: string;
  quickReplies?: string[];
  data?: any;
}

export const generateResponse = async (
  intent: ChatIntent,
  message: string,
  userId?: string
): Promise<ChatResponse> => {
  switch (intent) {
    case ChatIntent.GREETING:
      return {
        text: "Hi there! 👋 I'm your Farm-to-Table assistant. How can I help you today?",
        quickReplies: [
          'Track my order',
          'Browse products',
          'Check delivery time',
          'Talk to support',
        ],
      };

    case ChatIntent.TRACK_ORDER:
      const orderNumber = extractOrderNumber(message);
      if (orderNumber) {
        // TODO: Fetch actual order status from Order Service
        return {
          text: `I found your order ${orderNumber}! Let me check its status...

**Status**: In Transit 🚚
**Expected Delivery**: Tomorrow at 2:00 PM
**Current Location**: Downtown Distribution Center

Would you like to see the live tracking map?`,
          quickReplies: ['View map', 'Contact driver', 'Get more details'],
        };
      } else {
        return {
          text: "I can help you track your order! Please provide your order number (e.g., ORD-1234-5678) or tell me which order you'd like to track.",
          quickReplies: ['Show my recent orders'],
        };
      }

    case ChatIntent.DELIVERY_TIME:
      // TODO: Fetch actual delivery times from Delivery Service
      return {
        text: "Most deliveries arrive within **24-48 hours** of order confirmation.\n\n**Standard Delivery**: 1-2 business days\n**Express Delivery**: Same day (if ordered before 10 AM)\n\nWould you like to check a specific order's delivery time?",
        quickReplies: ['Track an order', 'Browse products'],
      };

    case ChatIntent.PRODUCT_INQUIRY:
      // TODO: Search products from Product Service
      return {
        text: "I can help you find products! We have:\n\n🥬 **Vegetables** - Fresh, organic greens\n🍎 **Fruits** - Seasonal, locally sourced\n🌿 **Herbs** - Aromatic and fresh\n🥛 **Dairy** - Farm-fresh milk & cheese\n🥚 **Eggs** - Free-range eggs\n\nWhat are you looking for?",
        quickReplies: [
          'Show vegetables',
          'Show fruits',
          'Show dairy products',
        ],
      };

    case ChatIntent.PRICING:
      return {
        text: "Our prices vary by product and farmer. Most items range from:\n\n💰 **Vegetables**: $2-8 per lb\n💰 **Fruits**: $3-10 per lb\n💰 **Dairy**: $4-15 per item\n💰 **Eggs**: $5-8 per dozen\n\nWould you like to browse our full catalog?",
        quickReplies: ['Browse products', 'Check specific price'],
      };

    case ChatIntent.COMPLAINT:
      return {
        text: "I'm sorry to hear you're having an issue. 😔\n\nI'd like to help resolve this right away. Can you tell me more about the problem?\n\n• Wrong items\n• Damaged products\n• Late delivery\n• Quality issues\n\nOr would you prefer to speak with a human support agent?",
        quickReplies: ['Speak to agent', 'Report issue'],
      };

    case ChatIntent.HELP:
      return {
        text: "I'm here to help! Here's what I can do for you:\n\n📦 **Track Orders** - Check your order status\n🛒 **Browse Products** - Find fresh farm products\n🚚 **Delivery Info** - Get delivery estimates\n💬 **Support** - Answer your questions\n\nWhat would you like to do?",
        quickReplies: [
          'Track order',
          'Browse products',
          'Talk to human',
        ],
      };

    case ChatIntent.UNKNOWN:
    default:
      return {
        text: "I'm not quite sure I understood that. I can help you with:\n\n• Tracking orders\n• Finding products\n• Delivery information\n• General questions\n\nWhat would you like help with?",
        quickReplies: [
          'Track my order',
          'Browse products',
          'Talk to support',
        ],
      };
  }
};
