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
  debug: true // optional
});

// Using REST API
async function example() {
  // Get available backends
  const backends = await client.api.getAvailableBackends();
  console.log(backends);

  // Create a workflow
  const workflow = await client.api.createWorkflow({
    name: 'My Workflow',
    config: {
      // workflow configuration
    }
  });

  // Run a prompt
  const prompt = await client.api.prompt({
    workflow_id: workflow.data.id,
    inputs: {
      // prompt inputs
    }
  });
}

// Using WebSocket
const ws = client.connectWebsocket();

ws.addMessageHandler('status', (data) => {
  console.log('Status update:', data);
});

// Don't forget to close connections when done
client.close();
```

### Error Handling

```typescript
import { APIError, AuthenticationError, ConnectionError } from 'comfyone-sdk';

try {
  await client.api.getAvailableBackends();
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Authentication failed:', error.message);
  } else if (error instanceof ConnectionError) {
    console.error('Connection error:', error.message);
  } else if (error instanceof APIError) {
    console.error('API error:', error.message, 'Code:', error.code);
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
  connectWebsocket(): OneThingAIWebSocket;
  close(): void;
}
```

### ComfyOneClient Class

Handles REST API interactions.

```typescript
class ComfyOneClient {
  getAvailableBackends(): Promise<APIResponse>;
  registerBackend(instanceId: string): Promise<APIResponse>;
  deleteBackend(instanceId: string): Promise<APIResponse>;
  setBackendState(name: string, state: 'up' | 'down'): Promise<APIResponse>;
  getBackend(name: string): Promise<APIResponse>;
  createWorkflow(payload: WorkflowPayload): Promise<APIResponse>;
  getWorkflows(): Promise<APIResponse>;
  getWorkflow(workflowId: string): Promise<APIResponse>;
  updateWorkflow(workflowId: string, payload: WorkflowPayload): Promise<APIResponse>;
  deleteWorkflow(workflowId: string): Promise<APIResponse>;
  uploadFile(filePath: string): Promise<APIResponse>;
  prompt(payload: PromptPayload): Promise<APIResponse>;
  getPromptStatus(promptId: string): Promise<APIResponse>;
  cancelPrompt(promptId: string): Promise<APIResponse>;
  downloadFile(url: string, savePath?: string): Promise<string>;
}
```

### OneThingAIWebSocket Class

Handles WebSocket connections and real-time updates.

```typescript
class OneThingAIWebSocket {
  constructor(config: WebSocketConfig);
  connect(): void;
  start(): void;
  close(): void;
  sendMessage(message: WebSocketMessage): void;
  addMessageHandler(messageType: string, handler: MessageHandler): void;
  removeMessageHandler(messageType: string): void;
  setErrorHandler(handler: ErrorHandler): void;
  setConnectionHandler(handler: ConnectionHandler): void;
  isConnected(): boolean;
}
```

## License

This project is licensed under the same terms as the Python version. 