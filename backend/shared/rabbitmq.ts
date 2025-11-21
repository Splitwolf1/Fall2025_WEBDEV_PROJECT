import { connect, Connection, Channel, ConsumeMessage, ChannelModel } from 'amqplib';

export class RabbitMQClient {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private channelModel: ChannelModel | null = null;
  private url: string;

  constructor(url?: string) {
    this.url = url || process.env.RABBITMQ_URL || 'amqp://localhost:5672';
  }

  async connect(): Promise<void> {
    try {
      this.channelModel = await connect(this.url);
      this.connection = this.channelModel.connection;
      this.channel = await this.channelModel.createChannel();
      console.log('✅ RabbitMQ connected');

      // Handle connection errors
      this.connection.on('error', (err) => {
        console.error('❌ RabbitMQ connection error:', err);
      });

      this.connection.on('close', () => {
        console.log('⚠️ RabbitMQ connection closed');
      });
    } catch (error) {
      console.error('❌ Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  async publish(
    exchange: string,
    routingKey: string,
    message: any
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    try {
      await this.channel.assertExchange(exchange, 'topic', { durable: true });
      this.channel.publish(
        exchange,
        routingKey,
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );
      console.log(`📤 Published to ${exchange}:${routingKey}`, message);
    } catch (error) {
      console.error('❌ Failed to publish message:', error);
      throw error;
    }
  }

  async subscribe(
    queue: string,
    exchange: string,
    pattern: string,
    callback: (message: any) => void | Promise<void>
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    try {
      await this.channel.assertExchange(exchange, 'topic', { durable: true });
      await this.channel.assertQueue(queue, { durable: true });
      await this.channel.bindQueue(queue, exchange, pattern);

      console.log(`📥 Subscribed to ${exchange}:${pattern} on queue ${queue}`);

      this.channel.consume(queue, async (msg: ConsumeMessage | null) => {
        if (msg) {
          try {
            const content = JSON.parse(msg.content.toString());
            await callback(content);
            this.channel?.ack(msg);
          } catch (error) {
            console.error('❌ Error processing message:', error);
            // Reject and requeue message
            this.channel?.nack(msg, false, true);
          }
        }
      });
    } catch (error) {
      console.error('❌ Failed to subscribe:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    try {
      await this.channel?.close();
      await this.channelModel?.close();
      console.log('✅ RabbitMQ connection closed');
    } catch (error) {
      console.error('❌ Error closing RabbitMQ connection:', error);
    }
  }
}

// Singleton instance
let rabbitMQInstance: RabbitMQClient | null = null;

export const getRabbitMQClient = async (): Promise<RabbitMQClient> => {
  if (!rabbitMQInstance) {
    rabbitMQInstance = new RabbitMQClient();
    await rabbitMQInstance.connect();
  }
  return rabbitMQInstance;
};
