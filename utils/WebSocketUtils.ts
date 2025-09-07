import { WebSocket } from 'ws';
import { WebSocketMessage } from '../types/index.js';

export class WebSocketUtils {
  static sendMessage(ws: WebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({
          ...message,
          timestamp: message.timestamp || new Date().toISOString(),
        }));
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    }
  }

  static sendError(ws: WebSocket, message: string, code?: string): void {
    this.sendMessage(ws, {
      type: 'error',
      message,
      code,
    });
  }

  static sendSuccess(ws: WebSocket, message: string, data?: any): void {
    this.sendMessage(ws, {
      type: 'success',
      message,
      data,
    });
  }

  static broadcast(clients: Set<WebSocket>, message: WebSocketMessage): void {
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        this.sendMessage(client, message);
      }
    });
  }

  static parseMessage(data: string): WebSocketMessage | null {
    try {
      const message = JSON.parse(data);
      if (!message.type) {
        throw new Error('Message must have a type field');
      }
      return message;
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      return null;
    }
  }

  static validateMessage(message: any, requiredFields: string[]): boolean {
    return requiredFields.every(field => message.hasOwnProperty(field));
  }

  static createHeartbeat(interval: number = 30000): NodeJS.Timeout {
    return setInterval(() => {
      // This would typically ping all connected clients
      console.log('Heartbeat ping');
    }, interval);
  }

  static handleConnection(ws: WebSocket): void {
    console.log('New WebSocket connection established');
    
    ws.on('pong', () => {
      console.log('Received pong from client');
    });

    // Send initial ping
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  }

  static handleDisconnection(ws: WebSocket): void {
    console.log('WebSocket connection closed');
    // Cleanup any resources associated with this connection
  }

  static isValidWebSocket(ws: WebSocket): boolean {
    return ws.readyState === WebSocket.OPEN;
  }

  static getClientInfo(ws: WebSocket): any {
    return {
      readyState: ws.readyState,
      protocol: ws.protocol,
      extensions: ws.extensions,
    };
  }
}