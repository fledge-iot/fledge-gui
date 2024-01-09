// interface for Schedule

export class Schedule {
  id: string;
  name: string;
  processName: boolean;
  type: string;
  repeat: number;
  time: number;
  day: number;
  exclusive: boolean;
  enabled: boolean;
}
