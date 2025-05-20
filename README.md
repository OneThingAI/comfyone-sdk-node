# ComfyOne SDK - TypeScript Version

This is the TypeScript version of the ComfyOne SDK, providing a type-safe interface to interact with the ComfyOne API and WebSocket services.

## Installation

```bash
npm install comfyone-sdk
# or
yarn add comfyone-sdk
```

## Usage

### Basic Usage

```typescript
import { ComfyOne } from 'comfyone-sdk';

const client = new ComfyOne({
  apiKey: 'your-api-key',
  domain: 'pandora-server-cf.onethingai.com', // optional
  debug: true, // optional
  maxRetries: 3, // optional
  timeout: 5000, // optional
  logger: console // optional
});

// Using REST API
async function example() {
  try {
    // Get available backends
    const backends = await client.api.getAvailableBackends();
    console.log(backends);

    // Create a workflow
    const workflow = await client.api.createWorkflow({
      name: 'My Workflow',
      inputs: {
        // workflow input configuration
      },
      outputs: {
        // workflow output configuration
      },
      workflow: {
        // workflow definition
      }
    });

    // Run a prompt
    const prompt = await client.api.prompt({
      workflow_id: workflow.data.id,
      inputs: {
        // prompt inputs matching workflow configuration
      }
    });

    // Check prompt status
    const status = await client.api.getPromptStatus(prompt.data.id);
    console.log('Prompt status:', status);

    // Cancel a prompt if needed
    await client.api.cancelPrompt(prompt.data.id);

  } catch (error) {
    handleError(error);
  }
}

// Using WebSocket for real-time updates
const ws = client.connectWebsocket();

ws.addMessageHandler('status', (data) => {
  console.log('Status update:', data);
});

ws.addMessageHandler('error', (data) => {
  console.error('Error:', data);
});

// Don't forget to close connections when done
client.close();
```

### Error Handling

```typescript
import { APIError, AuthenticationError, ConnectionError } from 'comfyone-sdk';

function handleError(error: unknown) {
  if (error instanceof AuthenticationError) {
    console.error('Authentication failed:', error.message);
  } else if (error instanceof ConnectionError) {
    console.error('Connection error:', error.message);
  } else if (error instanceof APIError) {
    console.error('API error:', error.message, 'Code:', error.code);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## API Documentation

### ComfyOne Class

The main class for interacting with ComfyOne services.

```typescript
interface ComfyOneConfig {
  apiKey: string;
  domain?: string;
  maxRetries?: number;
  timeout?: number;
  debug?: boolean;
  logger?: any;
}

class ComfyOne {
  constructor(config: ComfyOneConfig);
  readonly api: ComfyOneClient;  // Access REST API methods
  connectWebsocket(): OneThingAIWebSocket;  // Initialize WebSocket connection
  close(): void;  // Close all connections
}
```

### ComfyOneClient Class

Handles REST API interactions.

```typescript
interface WorkflowPayload {
  name: string;
  inputs: any;
  outputs: any;
  workflow: any;
}

interface PromptPayload {
  workflow_id: string;
  inputs: any;
}

class ComfyOneClient {
  // Backend Management
  getAvailableBackends(): Promise<APIResponse>;
  registerBackend(instanceId: string): Promise<APIResponse>;
  deleteBackend(instanceId: string): Promise<APIResponse>;
  setBackendState(name: string, state: 'up' | 'down'): Promise<APIResponse>;
  getBackend(name: string): Promise<APIResponse>;

  // Workflow Management
  createWorkflow(payload: WorkflowPayload): Promise<APIResponse>;
  getWorkflows(): Promise<APIResponse>;
  getWorkflow(workflowId: string): Promise<APIResponse>;
  updateWorkflow(workflowId: string, payload: WorkflowPayload): Promise<APIResponse>;
  deleteWorkflow(workflowId: string): Promise<APIResponse>;

  // File Operations
  uploadFile(filePath: string): Promise<APIResponse>;
  downloadFile(url: string, savePath?: string): Promise<string>;

  // Prompt Operations
  prompt(payload: PromptPayload): Promise<APIResponse>;
  getPromptStatus(promptId: string): Promise<APIResponse>;
  cancelPrompt(promptId: string): Promise<APIResponse>;
}
```

### OneThingAIWebSocket Class

Handles WebSocket connections and real-time updates.

```typescript
interface WebSocketConfig {
  token: string;
  url?: string;
  reconnectDelay?: number;
  logger?: any;
}

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

type MessageHandler = (data: Record<string, any>) => void;
type ErrorHandler = (error: Error) => void;
type ConnectionHandler = (connected: boolean) => void;

class OneThingAIWebSocket {
  constructor(config: WebSocketConfig);
  connect(): void;  // Connect to WebSocket server
  start(): void;    // Start connection and auto-reconnect
  close(): void;    // Close connection
  sendMessage(message: WebSocketMessage): void;
  addMessageHandler(messageType: string, handler: MessageHandler): void;
  removeMessageHandler(messageType: string): void;
  setErrorHandler(handler: ErrorHandler): void;
  setConnectionHandler(handler: ConnectionHandler): void;
  isConnected(): boolean;
}
```

## License

This project is licensed under the MIT License. See the LICENSE file for details. 