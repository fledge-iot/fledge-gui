// interface for Control API Entrypoints

// TODO: make type Enum
// TODO: make destination Enum
export class APIFlow {
  name: string;
  description: string;
  type: string;
  operation_name?: string;
  destination: string;
  destination_name?: string;
  constants: {};
  variables: {};
  anonymous: boolean;
  allow: string[] // List of allowed users' username
}