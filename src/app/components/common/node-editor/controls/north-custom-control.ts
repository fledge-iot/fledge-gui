import { ClassicPreset } from "rete";

export class SentReadingsControl extends ClassicPreset.Control {
  constructor(public sent: number) {
    super();
  }
}

export class ExecutionControl extends ClassicPreset.Control {
  constructor(public execution: string) {
    super();
  }
}
