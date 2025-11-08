// Socket.io client for real-time notifications

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3006';

class SocketClient {
  private socket: Socket | null = null;
  private connected: boolean = false;

  connect(userId: string, role: string) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    try {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 5000,
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log('✅ Connected to notification service');
        this.connected = true;

        // Join user-specific room
        this.socket?.emit('join', { userId, role });
      });

      this.socket.on('joined', (data) => {
        console.log('Joined notification rooms:', data);
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Disconnected from notification service');
        this.connected = false;
      });

      this.socket.on('connect_error', (error) => {
        // Silently handle connection errors - notification service is optional
        console.warn('⚠️ Notification service unavailable (non-critical):', error.message);
        this.connected = false;
      });

      this.socket.on('reconnect_error', (error) => {
        console.warn('⚠️ Notification service reconnection failed (non-critical):', error.message);
      });

      return this.socket;
    } catch (error: any) {
      // Silently handle initialization errors
      console.warn('⚠️ Socket client initialization failed (non-critical):', error.message);
      return null;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  onNotification(callback: (notification: any) => void) {
    if (this.socket) {
      this.socket.on('notification', callback);
    }
  }

  offNotification(callback?: (notification: any) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off('notification', callback);
      } else {
        this.socket.off('notification');
      }
    }
  }

  isConnected() {
    return this.connected;
  }

  getSocket() {
    return this.socket;
  }
}

// Export singleton instance
export const socketClient = new SocketClient();

export default socketClient;
