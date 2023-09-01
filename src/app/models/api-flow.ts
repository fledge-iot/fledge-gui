// interface for Control API Entrypoints

export class APIFlow {
  name: string;
  description: string;
  type: APIFlowType;
  operation_name?: string;
  destination: string;
  destination_name?: string;
  constants: {};
  variables: {};
  anonymous: any;  // TODO: FOGL-8070
  allow: string[] // List of allowed users' username
}

export enum APIFlowType {
  write = 0,
  operation = 1
}
