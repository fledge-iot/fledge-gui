// interface for Control API Entrypoints

export class APIFlow {
  name: string;
  description: string;
  permitted: boolean;
  type: string;
  operation_name?: string;
  destination: string;
  destination_name?: string;
  constants: {};
  variables: {};
  anonymous: any;  // TODO: FOGL-8070
  allow: string[] // List of allowed users' username
}
