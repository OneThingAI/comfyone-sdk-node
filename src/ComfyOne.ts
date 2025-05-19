import { ComfyOneClient } from './api/ComfyOneClient';
import { OneThingAIWebSocket } from './api/websocket/WebSocketClient';
import { APIResponse } from './types';

export interface ComfyOneConfig {
  apiKey: string;
  domain?: string;
  maxRetries?: number;
  timeout?: number;
  debug?: boolean;
  logger?: any;
}

export class ComfyOne {
  private domain: string;
  private baseUrl: string;
  private wsUrl: string;
  private logger: any;
  public readonly api: ComfyOneClient;
  private ws: OneThingAIWebSocket | null = null;

  constructor(config: ComfyOneConfig) {
    this.domain = config.domain || 'pandora-server-cf.onethingai.com';
    this.baseUrl = `https://${this.domain}`;
    this.wsUrl = `wss://${this.domain}/v1/ws`;

    // Set up logging
    const logLevel = config.debug ? 'debug' : 'info';
    this.logger = config.logger || console;
    this.logger.level = logLevel;

    // Initialize components
    this.api = new ComfyOneClient(
      config.apiKey,
      this.baseUrl,
      config.maxRetries,
      config.timeout,
      this.logger
    );
  }

  public connectWebsocket(): OneThingAIWebSocket {
    if (!this.ws) {
      this.ws = new OneThingAIWebSocket({
        token: this.api.getApiKey(),
        url: this.wsUrl,
        logger: this.logger
      });
      this.ws.start();
    }
    return this.ws;
  }

  public close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
} 