import { ComfyOne } from '../src';
import {
  IOType,
  PromptPayload,
  WorkflowPayload
} from '../src/types/workflow';
import * as fs from 'fs';
import * as path from 'path';

// Global WebSocket client for cleanup
let wsClient: any = null;

// Handle shutdown signals
function setupSignalHandlers() {
  const cleanup = () => {
    console.log("\nShutdown signal received. Closing connections...");
    if (wsClient) {
      wsClient.close();
    }
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

async function main() {
  // Initialize API client
  const client = new ComfyOne({
    apiKey: "your_api_key_here",
    debug: true
  });

  // Replace with your actual instance IDs
  const instanceIdsToRegister = new Set(["your_instance_id_here"]);

  try {
    // Query available backends
    const existingBackends = await client.api.getAvailableBackends();
    console.log('Available backends:', existingBackends);

    // Check which instances need registration
    const existingInstanceIds = new Set(existingBackends.data.map((backend: any) => backend.name));
    const needRegisterInstanceIds = new Set(
      [...instanceIdsToRegister].filter(id => !existingInstanceIds.has(id))
    );
    console.log('Need to register instances:', needRegisterInstanceIds);

    // Register new instances
    for (const instanceId of needRegisterInstanceIds) {
      console.log('Registering instance:', instanceId);
      const registerResult = await client.api.registerBackend(instanceId);
      console.log('Register result:', registerResult);
      if (registerResult && registerResult.code === 0) {
        console.log(`Successfully registered instance: ${JSON.stringify(registerResult.data)}`);
      } else {
        console.log(`Failed to register instance: ${registerResult.code}, ${registerResult.message}`);
        continue;
      }
    }

    // Initialize WebSocket client
    const ws = client.connectWebsocket();
    wsClient = ws; // Store for cleanup

    // Read workflow data from file
    const workflowData = JSON.parse(fs.readFileSync(path.join(__dirname, 'test_flow.json'), 'utf-8').toString().trim());

    const workflowPayload: WorkflowPayload = {
      name: "test",
      inputs: [{id: '5', type: IOType.NUMBER, name: 'height'},
           {id: '5', type: IOType.NUMBER, name: 'width'}],
      outputs: ['9'],
      workflow: workflowData
    };

    // Set up WebSocket message handlers
    ws.addMessageHandler("pending", (data: any) => {
      console.log(`Task ${data.taskId} pending, current position: ${data.data.current}`);
    });

    ws.addMessageHandler("progress", (data: any) => {
      console.log(`Task ${data.taskId} in progress: ${data.data.process}%`);
    });

    ws.addMessageHandler("finished", async (data: any) => {
      if (data.data.success) {
        console.log('Task completed:', data);
        const statusResponse = await client.api.getPromptStatus(data.taskId);
        console.log('Status:', statusResponse);

        if (statusResponse.data.images) {
          try {
            // Download results
            for (const url of statusResponse.data.images) {
              console.log('Downloading image:', url);
              const savedPath = await client.api.downloadFile(url);
              console.log(`Downloaded result to: ${savedPath}`);
            }
          } catch (error) {
            console.error(`Failed to download file: ${error}`);
          }
        }
      }
    });

    ws.addMessageHandler("error", (data: any) => {
      console.error(`Task execution error: ${data.data.message}`);
    });

    // Create workflow
    const createWorkflowResult = await client.api.createWorkflow(workflowPayload);
    console.log('Create workflow result:', createWorkflowResult);

    if (createWorkflowResult.code === 0) {
      // Generate image
      const promptPayload: PromptPayload = {
        workflow_id: createWorkflowResult.data.id,
        inputs: [{id: '5', params: {width: 1024, height: 1024}}] 
      };

      const promptResult = await client.api.prompt(promptPayload);
      if (promptResult.code === 0) {
        console.log('Prompt result:', promptResult);
        console.log('Prompt data:', promptResult.data);
      } else {
        console.error(`Failed to generate image: ${promptResult.code}, ${promptResult.message}`);
        process.exit(1);
      }
    } else {
      console.error(`Failed to create workflow: ${createWorkflowResult.code}, ${createWorkflowResult.message}`);
      process.exit(1);
    }

    // Keep the process running
    setInterval(() => {}, 1000);

  } catch (error) {
    console.error('Error:', error);
    if (wsClient) {
      wsClient.close();
    }
    process.exit(1);
  }
}

// Set up signal handlers and run the main function
setupSignalHandlers();
main().catch(console.error); 