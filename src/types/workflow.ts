export enum IOType {
  NUMBER = 'number',
  STRING = 'string',
  BOOLEAN = 'boolean',
  IMAGE = 'image'
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



