export class APIFlow {
    name: string;
    description: string;
    type: string;  // it can be either operation or write
    operation_name?: string;
    destination: string;
    destination_name?: string;
    constants: {};
    variables: {};
    anonymous: boolean;
    allow: string[]
  }
  