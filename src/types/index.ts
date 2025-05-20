export interface APIResponse {
  code: number;
  message: string;
  data: any;
}

export interface WorkflowPayload {
  name: string;
  inputs: any;
  outputs: any;
  workflow: any;
}

export interface PromptPayload {
  workflow_id: string;
  inputs: any;
}

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface WebSocketConfig {
  token: string;
  url?: string;
  reconnectDelay?: number;
  logger?: any;
}

export interface MessageHandler {
  (data: Record<string, any>): void;
}

export interface ErrorHandler {
  (error: Error): void;
}

export interface ConnectionHandler {
  (): void;
} 