class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, ((data: any) => void)[]> = new Map();
  private isConnecting = false;

  constructor() {
    this.connect();
  }

  connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;

    try {
      // For development, we'll use a mock WebSocket
      // In production, this would be your actual WebSocket server URL
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? 'wss://your-websocket-server.com/ws'
        : 'ws://localhost:8080/ws';

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.emit('connected', { status: 'connected' });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit(data.type, data.payload);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnecting = false;
        this.emit('disconnected', { status: 'disconnected' });
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        this.emit('error', { error });
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.log('Max reconnection attempts reached');
      this.emit('reconnectFailed', { attempts: this.reconnectAttempts });
    }
  }

  send(type: string, payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('WebSocket not connected, message not sent:', { type, payload });
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: (data: any) => void) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Mock WebSocket implementation for development
class MockWebSocketService {
  private listeners: Map<string, ((data: any) => void)[]> = new Map();
  private connected = false;
  private mockUsers: any[] = [];
  private mockMessages: any[] = [];
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeMockData();
    this.startMockConnection();
  }

  private initializeMockData() {
    this.mockUsers = [
      { id: '1', username: 'Ahmed Hassan', isOnline: true, isPremium: true, isAdmin: false },
      { id: '2', username: 'Fatima Zahra', isOnline: true, isPremium: false, isAdmin: false },
      { id: '3', username: 'Mohammed Ali', isOnline: false, isPremium: false, isAdmin: false },
      { id: '4', username: 'Seyad Ahmed Bashir', isOnline: true, isPremium: true, isAdmin: true },
      { id: '5', username: 'Ayishathul Hazeena', isOnline: true, isPremium: true, isAdmin: true },
    ];
  }

  private startMockConnection() {
    // Simulate connection delay
    setTimeout(() => {
      this.connected = true;
      this.emit('connected', { status: 'connected' });
      
      // Start periodic updates
      this.intervalId = setInterval(() => {
        this.simulateActivity();
      }, 5000);
    }, 1000);
  }

  private simulateActivity() {
    // Simulate random user status changes
    const randomUser = this.mockUsers[Math.floor(Math.random() * this.mockUsers.length)];
    const wasOnline = randomUser.isOnline;
    randomUser.isOnline = Math.random() > 0.3; // 70% chance of being online
    
    if (wasOnline !== randomUser.isOnline) {
      this.emit('userStatusChange', {
        userId: randomUser.id,
        username: randomUser.username,
        isOnline: randomUser.isOnline,
      });
    }

    // Simulate random messages
    if (Math.random() > 0.7) { // 30% chance of new message
      const sender = this.mockUsers[Math.floor(Math.random() * this.mockUsers.length)];
      const receiver = this.mockUsers[Math.floor(Math.random() * this.mockUsers.length)];
      
      if (sender.id !== receiver.id) {
        const message = {
          id: Date.now().toString(),
          senderId: sender.id,
          receiverId: receiver.id,
          senderName: sender.username,
          content: this.getRandomMessage(),
          timestamp: new Date(),
        };
        
        this.emit('newMessage', message);
      }
    }
  }

  private getRandomMessage(): string {
    const messages = [
      'Assalamu Alaikum! How are you today?',
      'JazakAllah Khair for your help!',
      'Can you help me with this hadith?',
      'I found this interesting hadith today...',
      'May Allah reward you for your efforts.',
      'SubhanAllah! This is amazing.',
      'I have a question about this topic.',
      'Thank you for the explanation.',
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  send(type: string, payload: any) {
    // Simulate sending messages
    if (type === 'sendMessage') {
      setTimeout(() => {
        this.emit('messageSent', {
          id: Date.now().toString(),
          ...payload,
          timestamp: new Date(),
        });
      }, 100);
    } else if (type === 'userTyping') {
      setTimeout(() => {
        this.emit('userTyping', payload);
      }, 50);
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: (data: any) => void) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  disconnect() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.connected = false;
    this.emit('disconnected', { status: 'disconnected' });
  }
}

// Export the appropriate service based on environment
export const websocketService = process.env.NODE_ENV === 'production' 
  ? new WebSocketService()
  : new MockWebSocketService();

export default websocketService;
