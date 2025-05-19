export enum IOType {
  NUMBER = 'number',
  STRING = 'string',
  BOOLEAN = 'boolean',
  IMAGE = 'image'
}

export interface WorkflowInput {
  id: string;
  type: IOType;
  name: string;
}

export interface WorkflowOutput {
  id: string;
  type: string;
}

export interface WorkflowInputPayload {
  inputs: WorkflowInput[];
}

export interface WorkflowOutputPayload {
  outputs: WorkflowOutput[];
}

export interface PromptInput {
  id: string;
  params: Record<string, any>;
}

export interface PromptPayload {
  workflow_id: string;
  inputs: PromptInput[];
}

export interface WorkflowPayload {
  name: string;
  config: any;
  description?: string;
} 