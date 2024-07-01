export interface NorthTask {
  id: string
  name: string
  processName: string
  repeat: number
  day: any
  repeatDays?: number
  repeatTime?: number
  enabled: boolean
  exclusive: boolean
  execution: string
  taskStatus: TaskStatus
  sent: number
  plugin: Plugin
  status?: string
}

export interface TaskStatus {
  state: string
  startTime: string
  endTime: string
  exitCode: string
  reason: string
}

export interface Plugin {
  name: string
  version: string
}
