// Email service using Resend
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || '');

interface EmailNotification {
    to: string;
    subject: string;
    html: string;
}

export class EmailService {
    private fromEmail = 'Farm2Table <noreply@resend.dev>';

    async sendEmail(notification: EmailNotification): Promise<boolean> {
        try {
            if (!process.env.RESEND_API_KEY) {
                console.warn('⚠️ RESEND_API_KEY not set - email not sent');
                return false;
            }

            const { data, error } = await resend.emails.send({
                from: this.fromEmail,
                to: notification.to,
                subject: notification.subject,
                html: notification.html,
            });

            if (error) {
                console.error('❌ Email send failed:', error);
                return false;
            }

            console.log(`✅ Email sent successfully:`, data?.id);
            return true;
        } catch (error) {
            console.error('❌ Email service error:', error);
            return false;
        }
    }

    // Order notification templates
    async sendOrderConfirmation(order: any, customerEmail: string) {
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #16a34a;">✅ Order Confirmed!</h1>
        <p>Hi there,</p>
        <p>Your order has been confirmed and is being prepared by the farmer.</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Order Details:</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Order #:</strong> ${order.orderNumber}</li>
            <li><strong>Total:</strong> $${order.total?.toFixed(2)}</li>
            <li><strong>Status:</strong> ${order.status}</li>
          </ul>
        </div>

        <p>We'll notify you when your order is ready for delivery.</p>
        <p style="color: #6b7280; font-size: 14px;">Thank you for supporting local farmers! 🌱</p>
      </div>
    `;

        return this.sendEmail({
            to: customerEmail,
            subject: `Order #${order.orderNumber} Confirmed - Farm2Table`,
            html,
        });
    }

    async sendOrderStatusUpdate(order: any, customerEmail: string, status: string) {
        const statusMessages: Record<string, string> = {
            confirmed: '✅ Your order has been confirmed',
            preparing: '👨‍🌾 Your order is being prepared',
            ready: '📦 Your order is ready for delivery',
            in_transit: '🚚 Your order is on the way',
            delivered: '✨ Your order has been delivered',
            cancelled: '❌ Your order has been cancelled',
        };

        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>${statusMessages[status] || 'Order Update'}</h1>
        <p>Hi there,</p>
        <p>Your order #${order.orderNumber} status has been updated.</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>New Status:</strong> ${status.toUpperCase()}</p>
          <p><strong>Order Total:</strong> $${order.total?.toFixed(2)}</p>
        </div>

        <p style="color: #6b7280; font-size: 14px;">Farm2Table - Fresh from farm to your table 🌱</p>
      </div>
    `;

        return this.sendEmail({
            to: customerEmail,
            subject: `Order #${order.orderNumber} - ${statusMessages[status]}`,
            html,
        });
    }

    // Delivery notification templates
    async sendDeliveryUpdate(delivery: any, customerEmail: string, status: string) {
        const statusMessages: Record<string, string> = {
            assigned: '📋 Delivery has been assigned',
            picked_up: '📦 Your order has been picked up',
            in_transit: '🚚 Your delivery is on the way',
            delivered: '✅ Your delivery is complete',
        };

        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>${statusMessages[status] || 'Delivery Update'}</h1>
        <p>Your delivery status has been updated.</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Status:</strong> ${status.toUpperCase()}</p>
          <p><strong>Delivery Address:</strong> ${delivery.address || 'N/A'}</p>
          ${delivery.estimatedTime ? `<p><strong>ETA:</strong> ${delivery.estimatedTime}</p>` : ''}
        </div>

        <p style="color: #6b7280; font-size: 14px;">Track your delivery in real-time on Farm2Table 🚚</p>
      </div>
    `;

        return this.sendEmail({
            to: customerEmail,
            subject: `Delivery Update - ${statusMessages[status]}`,
            html,
        });
    }

    // Inspection notification templates
    async sendInspectionNotification(inspection: any, recipientEmail: string) {
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>🔍 Health Inspection Scheduled</h1>
        <p>A health inspection has been scheduled for your ${inspection.targetType}.</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Scheduled Date:</strong> ${inspection.scheduledDate || 'TBD'}</p>
          <p><strong>Inspector:</strong> ${inspection.inspectorName || 'Assigned'}</p>
          <p><strong>Type:</strong> ${inspection.targetType}</p>
        </div>

        <p>Please ensure all required documentation is ready.</p>
        <p style="color: #6b7280; font-size: 14px;">Farm2Table ensures food safety and quality 🛡️</p>
      </div>
    `;

        return this.sendEmail({
            to: recipientEmail,
            subject: 'Health Inspection Scheduled - Farm2Table',
            html,
        });
    }

    // Generic notification template
    async sendGenericNotification(
        recipientEmail: string,
        title: string,
        message: string,
        type: string = 'info'
    ) {
        const icons: Record<string, string> = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌',
        };

        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>${icons[type] || 'ℹ️'} ${title}</h1>
        <p>${message}</p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Farm2Table - Connecting farms to tables 🌱
        </p>
      </div>
    `;

        return this.sendEmail({
            to: recipientEmail,
            subject: `${title} - Farm2Table`,
            html,
        });
    }
}

export const emailService = new EmailService();
