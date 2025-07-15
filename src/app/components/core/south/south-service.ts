
export interface Service {
  name: string
  address: string
  management_port: number
  service_port: number
  protocol: string
  status: string
  assets: Asset[]
  plugin: Plugin
  debug?: Debug[];
  schedule_enabled: boolean
}

export interface Asset {
  count: number
  asset: string
}

export interface Plugin {
  name: string
  version: string
}

export interface Debug {
  debugger: string
  ingress: string
  egress: string
}
