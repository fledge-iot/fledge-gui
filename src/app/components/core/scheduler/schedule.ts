export interface Schedule {
    id?: string
    name: string
    processName?: string
    type: any
    repeat: number
    repeatDay?: number
    time: number
    day: any
    exclusive: boolean
    enabled: boolean
}