import axios, { AxiosInstance, AxiosResponse } from 'axios';
import fs from 'fs';
import path from 'path';
import { APIResponse, WorkflowPayload, PromptPayload } from '../types';
import { APIError, AuthenticationError, ConnectionError } from '../errors';

export class ComfyOneClient {
  protected apiKey: string;
  private baseUrl: string;
  private maxRetries: number;
  private timeout: number;
  private logger: any;
  private client: AxiosInstance;

  constructor(
    apiKey: string,
    baseUrl: string = 'https://pandora-server-cf.onethingai.com',
    maxRetries: number = 3,
    timeout: number = 5000,
    logger: any = console
  ) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.maxRetries = maxRetries;
    this.timeout = timeout;
    this.logger = logger;

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
  }

  private async requestApi<T = any>(
    api: string,
    payload?: any,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
    isFileUpload: boolean = false
  ): Promise<APIResponse> {
    const url = `${this.baseUrl}/${api}`;
    this.logger.debug(`API Request: ${method} ${url}`);

    let retryCount = 0;
    while (retryCount < this.maxRetries) {
      try {
        let response: AxiosResponse<T>;

        if (isFileUpload && method === 'POST' && payload) {
          const formData = new FormData();
          formData.append('file', new Blob([fs.readFileSync(payload)]), path.basename(payload));
          response = await this.client.post(api, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
        } else {
          console.log(`Request details:`, {
            method,
            url: api,
            data: payload
          });
          if (method === 'POST') {
            console.log('Payload details:');
            for (const [key, value] of Object.entries(payload)) {
              console.log(`${key} (${typeof key}) ${value} (${typeof value})`);
            }
            response = await this.client.post(api, payload, {
              headers: {
                'Content-Type': 'application/json'
              }
            });
          } else {
            response = await this.client.request({
              method,
              url: api,
              data: payload
            });
          }
        }

        this.logger.debug(`API Response: ${response.status} - ${api}`);
        return response.data as APIResponse;

      } catch (error: any) {
        if (error.response?.status === 401) {
          this.logger.error('API Authentication failed');
          throw new AuthenticationError(401, 'Invalid API key');
        }

        retryCount++;
        if (retryCount === this.maxRetries) {
          this.logger.error(`API failed after ${this.maxRetries} retries: ${api}`);
          throw new ConnectionError(`API request failed: ${error.message}`);
        }

        this.logger.warn(`API error, retry ${retryCount}/${this.maxRetries}: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      }
    }

    throw new APIError(500, 'Maximum retries reached');
  }
  
  public getApiKey(): string {
    return this.apiKey;
  }

  public async getAvailableBackends(): Promise<APIResponse> {
    return this.requestApi('v1/backends');
  }

  public async registerBackend(instanceId: string): Promise<APIResponse> {
    return this.requestApi('v1/backends', { "instance_id": instanceId }, 'POST');
  }

  public async deleteBackend(instanceId: string): Promise<APIResponse> {
    return this.requestApi(`v1/backends/${instanceId}`, undefined, 'DELETE');
  }

  public async setBackendState(name: string, state: 'up' | 'down'): Promise<APIResponse> {
    return this.requestApi(`v1/backends/${name}`, { state }, 'PATCH');
  }

  public async getBackend(name: string): Promise<APIResponse> {
    return this.requestApi(`v1/backends/${name}`);
  }

  public async createWorkflow(payload: WorkflowPayload): Promise<APIResponse> {
    return this.requestApi('v1/workflows', payload, 'POST');
  }

  public async getWorkflows(): Promise<APIResponse> {
    return this.requestApi('v1/workflows');
  }

  public async getWorkflow(workflowId: string): Promise<APIResponse> {
    return this.requestApi(`v1/workflows/${workflowId}`);
  }

  public async updateWorkflow(workflowId: string, payload: WorkflowPayload): Promise<APIResponse> {
    return this.requestApi(`v1/workflows/${workflowId}`, payload, 'PATCH');
  }

  public async deleteWorkflow(workflowId: string): Promise<APIResponse> {
    return this.requestApi(`v1/workflows/${workflowId}`, undefined, 'DELETE');
  }

  public async uploadFile(filePath: string): Promise<APIResponse> {
    const formData = new FormData();
    formData.append('file', new Blob([fs.readFileSync(filePath)]), path.basename(filePath));
    return this.requestApi('v1/files/upload', formData, 'POST', true);
  }

  public async prompt(payload: PromptPayload): Promise<APIResponse> {
    return this.requestApi('v1/prompts', payload, 'POST');
  }

  public async getPromptStatus(promptId: string): Promise<APIResponse> {
    return this.requestApi(`v1/prompts/${promptId}`);
  }

  public async cancelPrompt(promptId: string): Promise<APIResponse> {
    return this.requestApi(`v1/prompts/${promptId}/cancel`, undefined, 'POST');
  }

  public async downloadFile(url: string, savePath?: string): Promise<string> {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const defaultPath = path.join(process.cwd(), 'downloads', path.basename(url));
      const finalPath = savePath || defaultPath;

      await fs.promises.mkdir(path.dirname(finalPath), { recursive: true });
      await fs.promises.writeFile(finalPath, response.data);

      return finalPath;
    } catch (error: any) {
      throw new ConnectionError(`Failed to download file: ${error.message}`);
    }
  }
} 