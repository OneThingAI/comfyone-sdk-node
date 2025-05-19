import WebSocket from 'ws';
import { WebSocketConfig, WebSocketMessage, MessageHandler, ErrorHandler, ConnectionHandler } from '../../types';
import { ConnectionError } from '../../errors';

export class OneThingAIWebSocket {
  private url: string;
  private token: string;
  private ws: WebSocket | null = null;
  private running: boolean = false;
  private reconnectDelay: number;
  private logger: any;
  private messageHandlers: Map<string, MessageHandler> = new Map();
  private errorHandler?: ErrorHandler;
  private connectionHandler?: ConnectionHandler;

  constructor(config: WebSocketConfig) {
    this.token = config.token;
    this.url = config.url?.replace(/\/$/, '') || 'wss://pandora-server-cf.onethingai.com/v1/ws';
    this.reconnectDelay = config.reconnectDelay || 5;
    this.logger = config.logger || console;
  }

  private onMessage(message: string): void {
    try {
      const data = JSON.parse(message);
      const messageType = data.type;

      if (this.messageHandlers.has(messageType)) {
        this.messageHandlers.get(messageType)!(data);
      } else {
        this.logger.debug(`Unhandled message type: ${messageType}`);
        this.logger.debug(`Message content: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      this.logger.warn(`Invalid JSON message received: ${message}`);
    }
  }

  private onError(error: Error): void {
    if (this.errorHandler) {
      this.errorHandler(error);
    } else {
      this.logger.error(`WebSocket error: ${error.message}`);
    }
  }

  private onClose(code: number, reason: string): void {
    this.logger.info(`WebSocket connection closed [${code}]: ${reason}`);
    if (this.running) {
      this.logger.info(`Attempting to reconnect in ${this.reconnectDelay}s...`);
      setTimeout(() => this.connect(), this.reconnectDelay * 1000);
    }
  }

  private onOpen(): void {
    this.logger.info('WebSocket connection established');

    const authMessage: WebSocketMessage = {
      type: 'auth',
      token: this.token
    };

    this.ws?.send(JSON.stringify(authMessage));
    this.logger.debug('Authentication message sent');

    if (this.connectionHandler) {
      this.connectionHandler();
    }
  }

  public connect(): void {
    this.logger.debug(`Connecting to WebSocket server: ${this.url}`);

    this.ws = new WebSocket(this.url, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });

    this.ws.on('open', () => this.onOpen());
    this.ws.on('message', (data) => this.onMessage(data.toString()));
    this.ws.on('error', (error) => this.onError(error));
    this.ws.on('close', (code, reason) => this.onClose(code, reason.toString()));
  }

  public start(): void {
    this.running = true;
    this.connect();
  }

  public close(): void {
    this.logger.info('Closing WebSocket connection...');
    this.running = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public sendMessage(message: WebSocketMessage): void {
    if (!this.ws) {
      throw new ConnectionError('WebSocket connection not established');
    }

    try {
      this.ws.send(JSON.stringify(message));
      this.logger.debug(`Message sent: ${message.type || 'unknown'}`);
    } catch (error) {
      throw new ConnectionError(`Failed to send message: ${error}`);
    }
  }

  public addMessageHandler(messageType: string, handler: MessageHandler): void {
    this.messageHandlers.set(messageType, handler);
    this.logger.debug(`Added message handler for type: ${messageType}`);
  }

  public removeMessageHandler(messageType: string): void {
    this.messageHandlers.delete(messageType);
    this.logger.debug(`Removed message handler for type: ${messageType}`);
  }

  public setErrorHandler(handler: ErrorHandler): void {
    this.errorHandler = handler;
  }

  public setConnectionHandler(handler: ConnectionHandler): void {
    this.connectionHandler = handler;
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
} 