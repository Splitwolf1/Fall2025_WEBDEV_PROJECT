import { ChatIntent, extractOrderNumber, extractTargetParty } from './intents';
import {
  getOrderByNumber,
  getOrderById,
  getUserOrders,
  getDeliveryInfo,
  getDeliveryEstimate,
  searchProducts,
  getProductsByCategory,
  formatOrderStatus,
  formatDeliveryStatus
} from './services';

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
        try {
          const order = await getOrderByNumber(orderNumber);
          if (!order) {
            return {
              text: `I couldn't find order ${orderNumber}. Please check the order number and try again. Order numbers usually look like ORD-1234-5678.`,
              quickReplies: ['Show my recent orders'],
            };
          }

          const deliveryInfo = await getDeliveryInfo(orderNumber);
          const orderStatus = formatOrderStatus(order.status);

          let statusText = `I found your order ${orderNumber}!\n\n**Status**: ${orderStatus} 📦`;

          if (deliveryInfo) {
            const deliveryStatus = formatDeliveryStatus(deliveryInfo.status);
            statusText += `\n**Delivery Status**: ${deliveryStatus} 🚚`;

            if (deliveryInfo.estimatedDelivery) {
              const deliveryDate = new Date(deliveryInfo.estimatedDelivery).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              });
              statusText += `\n**Expected Delivery**: ${deliveryDate}`;
            }

            if (deliveryInfo.currentLocation) {
              statusText += `\n**Current Location**: ${deliveryInfo.currentLocation}`;
            }
          }

          statusText += `\n\nOrder Total: $${order.totalAmount.toFixed(2)}`;

          return {
            text: statusText,
            quickReplies: [
              `Talk to farmer for ${orderNumber}`,
              `Talk to distributor for ${orderNumber}`,
              'Track another order'
            ],
          };
        } catch (error) {
          console.error('Error tracking order:', error);
          return {
            text: `I'm having trouble accessing the order information right now. Please try again in a moment, or contact our support team for assistance.`,
            quickReplies: ['Contact support', 'Try again'],
          };
        }
      } else if (userId) {
        try {
          const recentOrders = await getUserOrders(userId);
          if (recentOrders.length === 0) {
            return {
              text: "You don't have any recent orders. Would you like to browse our fresh products?",
              quickReplies: ['Browse products', 'Contact support'],
            };
          }

          const orderList = recentOrders.slice(0, 3).map(order =>
            `• ${order.orderNumber} - ${formatOrderStatus(order.status)} ($${order.totalAmount.toFixed(2)})`
          ).join('\n');

          return {
            text: `Here are your recent orders:\n\n${orderList}\n\nWhich order would you like to track? Just tell me the order number.`,
            quickReplies: recentOrders.slice(0, 2).map(order => `Track ${order.orderNumber}`),
          };
        } catch (error) {
          console.error('Error fetching user orders:', error);
          return {
            text: "I can help you track your order! Please provide your order number (e.g., ORD-1234-5678).",
            quickReplies: ['Contact support'],
          };
        }
      } else {
        return {
          text: "I can help you track your order! Please provide your order number (e.g., ORD-1234-5678) or tell me which order you'd like to track.",
          quickReplies: ['Contact support'],
        };
      }

    case ChatIntent.DELIVERY_TIME:
      try {
        const deliveryEstimate = await getDeliveryEstimate();
        return {
          text: `${deliveryEstimate}\n\n**Standard Delivery**: 1-2 business days\n**Express Delivery**: Same day (if ordered before 10 AM)\n\nWould you like to check a specific order's delivery time?`,
          quickReplies: ['Track an order', 'Browse products'],
        };
      } catch (error) {
        console.error('Error fetching delivery estimate:', error);
        return {
          text: "Most deliveries arrive within **24-48 hours** of order confirmation.\n\n**Standard Delivery**: 1-2 business days\n**Express Delivery**: Same day (if ordered before 10 AM)\n\nWould you like to check a specific order's delivery time?",
          quickReplies: ['Track an order', 'Browse products'],
        };
      }

    case ChatIntent.PRODUCT_INQUIRY:
      try {
        // Try to extract category or search term from the message
        const lowerMessage = message.toLowerCase();
        let category = '';
        let searchTerm = '';

        if (lowerMessage.includes('vegetable') || lowerMessage.includes('veggie')) {
          category = 'vegetables';
        } else if (lowerMessage.includes('fruit')) {
          category = 'fruits';
        } else if (lowerMessage.includes('dairy') || lowerMessage.includes('milk') || lowerMessage.includes('cheese')) {
          category = 'dairy';
        } else if (lowerMessage.includes('herb')) {
          category = 'herbs';
        } else if (lowerMessage.includes('egg')) {
          category = 'eggs';
        } else {
          // Extract potential search term
          const words = message.split(' ');
          const productWords = words.filter(word =>
            !['show', 'find', 'search', 'looking', 'for', 'want', 'need', 'buy'].includes(word.toLowerCase())
          );
          searchTerm = productWords.join(' ');
        }

        let products = [];
        if (category) {
          products = await getProductsByCategory(category);
        } else if (searchTerm) {
          products = await searchProducts(searchTerm);
        } else {
          // Show general categories
          return {
            text: "I can help you find products! We have:\n\n🥬 **Vegetables** - Fresh, organic greens\n🍎 **Fruits** - Seasonal, locally sourced\n🌿 **Herbs** - Aromatic and fresh\n🥛 **Dairy** - Farm-fresh milk & cheese\n🥚 **Eggs** - Free-range eggs\n\nWhat are you looking for?",
            quickReplies: [
              'Show vegetables',
              'Show fruits',
              'Show dairy products',
            ],
          };
        }

        if (products.length === 0) {
          return {
            text: `I couldn't find any products matching "${searchTerm || category}". Here are our main categories:\n\n🥬 **Vegetables** - Fresh, organic greens\n🍎 **Fruits** - Seasonal, locally sourced\n🌿 **Herbs** - Aromatic and fresh\n🥛 **Dairy** - Farm-fresh milk & cheese\n🥚 **Eggs** - Free-range eggs`,
            quickReplies: [
              'Show vegetables',
              'Show fruits',
              'Show dairy products',
            ],
          };
        }

        const productList = products.map(product =>
          `🌱 **${product.name}** - $${product.price.toFixed(2)}/lb\n${product.description}`
        ).join('\n\n');

        return {
          text: `Here are some ${category || 'products'} we have available:\n\n${productList}\n\nWould you like to see more details about any of these?`,
          quickReplies: [
            'Browse more products',
            'Check prices',
            'Add to cart',
          ],
        };
      } catch (error) {
        console.error('Error searching products:', error);
        return {
          text: "I can help you find products! We have:\n\n🥬 **Vegetables** - Fresh, organic greens\n🍎 **Fruits** - Seasonal, locally sourced\n🌿 **Herbs** - Aromatic and fresh\n🥛 **Dairy** - Farm-fresh milk & cheese\n🥚 **Eggs** - Free-range eggs\n\nWhat are you looking for?",
          quickReplies: [
            'Show vegetables',
            'Show fruits',
            'Show dairy products',
          ],
        };
      }

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

    case ChatIntent.CHAT_WITH_PARTY:
      const targetParty = extractTargetParty(message);
      const chatOrderNumber = extractOrderNumber(message);

      if (!targetParty) {
        return {
          text: "Who would you like to talk to? I can connect you with:\n\n👨‍🌾 **Farmer** - About your order's produce\n🚚 **Distributor/Driver** - About delivery\n🍽️ **Restaurant** - About your order\n\nPlease specify who you'd like to contact.",
          quickReplies: ['Talk to farmer', 'Talk to distributor', 'Talk to restaurant'],
        };
      }

      if (!chatOrderNumber) {
        return {
          text: `I can connect you with the ${targetParty}! Please provide the order number so I can find the right person.\n\nFormat: ORD-XXXXX-XXXX`,
          quickReplies: ['Show my recent orders'],
        };
      }

      try {
        const order = await getOrderByNumber(chatOrderNumber);
        if (!order) {
          return {
            text: `I couldn't find order ${chatOrderNumber}. Please check the order number and try again.`,
            quickReplies: ['Show my recent orders', 'Track another order'],
          };
        }

        let targetUserId: string | null = null;
        let targetName: string = targetParty;

        if (targetParty === 'farmer') {
          targetUserId = (order as any).farmerId;
          targetName = (order as any).farmerName || 'Farmer';
        } else if (targetParty === 'customer') {
          targetUserId = (order as any).customerId;
          targetName = (order as any).customerName || 'Restaurant';
        } else if (targetParty === 'distributor') {
          const delivery = await getDeliveryInfo(chatOrderNumber);
          if (delivery) {
            targetUserId = (delivery as any).distributorId;
            targetName = (delivery as any).driverInfo?.name || 'Distributor';
          }
        }

        if (!targetUserId || targetUserId === '000000000000000000000000') {
          return {
            text: `The ${targetParty} hasn't been assigned to this order yet. Please try again later or contact support.`,
            quickReplies: ['Contact support', 'Track order'],
          };
        }

        return {
          text: `🎉 Great! I'm connecting you with **${targetName}** for order ${chatOrderNumber}.\n\nYou can now send messages directly. Type your message below!`,
          quickReplies: ['Cancel chat'],
          data: {
            chatEnabled: true,
            targetUserId: targetUserId,
            targetName: targetName,
            targetRole: targetParty,
            orderId: (order as any)._id?.toString() || order.id,
            orderNumber: chatOrderNumber,
          },
        };
      } catch (error) {
        console.error('Error setting up chat:', error);
        return {
          text: `I'm having trouble connecting you with the ${targetParty}. Please try again or contact support.`,
          quickReplies: ['Contact support', 'Try again'],
        };
      }

    case ChatIntent.TRACK_INSPECTION:
      // Extract inspection number from message
      const inspectionMatch = message.match(/INS-(\d+)/i);
      if (inspectionMatch) {
        const inspectionNumber = `INS-${inspectionMatch[1]}`;
        // Mock inspection data (in production, this would come from an inspection service)
        const mockInspection = {
          id: inspectionNumber,
          facility: 'Green Valley Farm',
          facilityOwnerId: '693c647a6f281c0da522a382', // farmer ID for demo
          facilityOwnerName: 'WOLF FARMS',
          address: '123 Farm Road, Greenville',
          type: 'Routine',
          status: 'completed',
          result: 'pass',
          scheduledDate: '2024-12-10',
          completedDate: '2024-12-10',
          inspector: 'Sarah Johnson',
        };

        return {
          text: `📋 **Inspection ${inspectionNumber}**\n\n🏢 **Facility:** ${mockInspection.facility}\n📍 **Address:** ${mockInspection.address}\n📝 **Type:** ${mockInspection.type}\n✅ **Status:** ${mockInspection.status.toUpperCase()}\n🏆 **Result:** ${mockInspection.result.toUpperCase()}\n📅 **Date:** ${mockInspection.scheduledDate}\n👤 **Inspector:** ${mockInspection.inspector}`,
          quickReplies: [
            `Talk to facility owner for ${inspectionNumber}`,
            'Show recent violations',
            'Upcoming inspections',
          ],
          data: {
            inspectionId: inspectionNumber,
            facilityOwnerId: mockInspection.facilityOwnerId,
            facilityOwnerName: mockInspection.facilityOwnerName,
          },
        };
      }

      return {
        text: "Please provide an inspection number (e.g., INS-702) to view details.",
        quickReplies: ['Upcoming inspections', 'Show recent violations', 'View inspection INS-702'],
      };

    case ChatIntent.GET_VIOLATIONS:
      // Mock violations data
      const mockViolations = [
        { id: 'VIO-101', facility: 'Sunrise Organics', type: 'Temperature', severity: 'Critical', status: 'Open', date: '2024-12-08' },
        { id: 'VIO-099', facility: 'Green Valley Farm', type: 'Sanitation', severity: 'Minor', status: 'Resolved', date: '2024-12-05' },
        { id: 'VIO-098', facility: 'Happy Harvest', type: 'Documentation', severity: 'Major', status: 'Pending', date: '2024-12-03' },
      ];

      const violationList = mockViolations.map(v =>
        `${v.severity === 'Critical' ? '🔴' : v.severity === 'Major' ? '🟡' : '🟢'} **${v.id}** - ${v.facility}\n   ${v.type} | ${v.status} | ${v.date}`
      ).join('\n\n');

      return {
        text: `📋 **Recent Violations**\n\n${violationList}`,
        quickReplies: ['View open violations', 'Upcoming inspections', 'Contact facility'],
      };

    case ChatIntent.GET_INSPECTIONS:
      const isUpcoming = message.toLowerCase().includes('upcoming') || message.toLowerCase().includes('scheduled');
      const isExpired = message.toLowerCase().includes('expired') || message.toLowerCase().includes('overdue');

      if (isExpired) {
        const expiredInspections = [
          { id: 'INS-680', facility: 'Old Mill Farm', dueDate: '2024-11-30', daysOverdue: 12 },
          { id: 'INS-675', facility: 'Valley Fresh', dueDate: '2024-11-25', daysOverdue: 17 },
        ];

        const expiredList = expiredInspections.map(i =>
          `⚠️ **${i.id}** - ${i.facility}\n   Due: ${i.dueDate} (${i.daysOverdue} days overdue)`
        ).join('\n\n');

        return {
          text: `🚨 **Overdue Inspections**\n\n${expiredList}`,
          quickReplies: ['Schedule inspection', 'Contact facility', 'View all inspections'],
        };
      }

      // Default: show upcoming inspections
      const upcomingInspections = [
        { id: 'INS-703', facility: 'Happy Harvest', date: '2024-12-15', time: '9:00 AM', type: 'Routine' },
        { id: 'INS-704', facility: 'Sunrise Organics', date: '2024-12-16', time: '2:00 PM', type: 'Follow-up' },
        { id: 'INS-705', facility: 'Mountain Fresh', date: '2024-12-18', time: '10:00 AM', type: 'Initial' },
      ];

      const upcomingList = upcomingInspections.map(i =>
        `📅 **${i.id}** - ${i.facility}\n   ${i.date} at ${i.time} | ${i.type}`
      ).join('\n\n');

      return {
        text: `📆 **Upcoming Inspections**\n\n${upcomingList}`,
        quickReplies: ['View inspection INS-703', 'Expired inspections', 'Show violations'],
      };

    case ChatIntent.UNKNOWN:
    default:
      return {
        text: "I'm not quite sure I understood that. I can help you with:\n\n• Tracking orders\n• Finding products\n• Delivery information\n• Messaging parties\n\nWhat would you like help with?",
        quickReplies: [
          'Track my order',
          'Browse products',
          'Talk to farmer',
        ],
      };
  }
};
