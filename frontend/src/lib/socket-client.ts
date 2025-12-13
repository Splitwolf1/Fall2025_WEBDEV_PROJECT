// Socket.io client for real-time notifications

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3007';

type NotificationCallback = (notification: any) => void;

class SocketClient {
  private socket: Socket | null = null;
  private connected: boolean = false;
  private pendingListeners: Set<NotificationCallback> = new Set();
  private activeListeners: Set<NotificationCallback> = new Set();

  connect(userId: string, role: string) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return this.socket;
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

        // Attach any pending listeners that were registered before connection
        this.pendingListeners.forEach(callback => {
          console.log('📧 Attaching pending notification listener');
          this.socket?.on('notification', callback);
          this.activeListeners.add(callback);
        });
        this.pendingListeners.clear();
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
      this.activeListeners.clear();
    }
  }

  onNotification(callback: NotificationCallback) {
    // If socket is already connected, attach immediately
    if (this.socket?.connected) {
      console.log('📧 Attaching notification listener (socket ready)');
      this.socket.on('notification', callback);
      this.activeListeners.add(callback);
    } else {
      // Queue the listener for when socket connects
      console.log('📧 Queuing notification listener (socket not ready yet)');
      this.pendingListeners.add(callback);
    }
  }

  offNotification(callback?: NotificationCallback) {
    if (callback) {
      this.pendingListeners.delete(callback);
      this.activeListeners.delete(callback);
      if (this.socket) {
        this.socket.off('notification', callback);
      }
    } else {
      this.pendingListeners.clear();
      this.activeListeners.clear();
      if (this.socket) {
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

