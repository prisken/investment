import { io, Socket } from 'socket.io-client';
import { StockQuote, MarketIndex } from '../types/stock';

export interface RealTimeStockUpdate {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: string;
  source: string;
}

export interface RealTimeMarketUpdate {
  indices: { [key: string]: MarketIndex };
  sectors: Array<{
    sector: string;
    performance: number;
  }>;
  timestamp: string;
}

export interface WebSocketEvents {
  'stock-update': (data: RealTimeStockUpdate) => void;
  'market-update': (data: RealTimeMarketUpdate) => void;
  'connection-status': (status: 'connected' | 'disconnected' | 'error') => void;
  'error': (error: string) => void;
}

class WebSocketService {
  private socket: Socket | null = null;
  private baseUrl: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.baseUrl, {
          transports: ['websocket', 'polling'],
          timeout: 20000,
          forceNew: true,
        });

        this.socket.on('connect', () => {
          console.log('✅ WebSocket connected');
          this.reconnectAttempts = 0;
          this.emit('connection-status', 'connected');
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log('❌ WebSocket disconnected:', reason);
          this.emit('connection-status', 'disconnected');
          
          if (reason === 'io server disconnect') {
            // Server initiated disconnect, don't reconnect
            return;
          }
          
          this.handleReconnect();
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ WebSocket connection error:', error);
          this.emit('connection-status', 'error');
          this.emit('error', error.message);
          reject(error);
        });

        this.socket.on('error', (error) => {
          console.error('❌ WebSocket error:', error);
          this.emit('error', error);
        });

        // Listen for real-time data updates
        this.socket.on('stock-update', (data: RealTimeStockUpdate) => {
          this.emit('stock-update', data);
        });

        this.socket.on('market-update', (data: RealTimeMarketUpdate) => {
          this.emit('market-update', data);
        });

        this.socket.on('batch-stock-update', (data: RealTimeStockUpdate[]) => {
          data.forEach(stock => this.emit('stock-update', stock));
        });

      } catch (error) {
        console.error('Failed to initialize WebSocket:', error);
        reject(error);
      }
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
      
      setTimeout(() => {
        if (this.socket) {
          this.socket.connect();
        }
      }, delay);
    } else {
      console.error('❌ Max reconnection attempts reached');
      this.emit('error', 'Max reconnection attempts reached');
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.eventListeners.clear();
  }

  // Subscribe to specific stock symbols for real-time updates
  subscribeToStocks(symbols: string[]): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('subscribe-stocks', symbols);
      console.log('📡 Subscribed to stocks:', symbols);
    }
  }

  // Unsubscribe from specific stock symbols
  unsubscribeFromStocks(symbols: string[]): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('unsubscribe-stocks', symbols);
      console.log('📡 Unsubscribed from stocks:', symbols);
    }
  }

  // Subscribe to market indices updates
  subscribeToMarketIndices(): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('subscribe-market-indices');
      console.log('📡 Subscribed to market indices');
    }
  }

  // Unsubscribe from market indices updates
  unsubscribeFromMarketIndices(): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('unsubscribe-market-indices');
      console.log('📡 Unsubscribed from market indices');
    }
  }

  // Request immediate data refresh
  requestDataRefresh(type: 'stocks' | 'market' | 'all'): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('request-refresh', type);
      console.log('🔄 Requested data refresh for:', type);
    }
  }

  // Event listener management
  on<K extends keyof WebSocketEvents>(event: K, callback: WebSocketEvents[K]): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off<K extends keyof WebSocketEvents>(event: K, callback: WebSocketEvents[K]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit<K extends keyof WebSocketEvents>(event: K, data: Parameters<WebSocketEvents[K]>[0]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          (callback as any)(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket ? this.socket.connected : false;
  }

  getConnectionState(): string {
    if (!this.socket) return 'disconnected';
    return this.socket.connected ? 'connected' : 'disconnected';
  }

  // Get connection statistics
  getConnectionStats(): { connected: boolean; reconnectAttempts: number; maxAttempts: number } {
    return {
      connected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts
    };
  }
}

// Create and export a singleton instance
const webSocketService = new WebSocketService();
export default webSocketService;
