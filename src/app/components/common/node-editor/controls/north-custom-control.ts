import { ClassicPreset } from "rete";

export class SentReadingsControl extends ClassicPreset.Control {
  constructor(public sent: string) {
    super();
  }
}

export class ExecutionControl extends ClassicPreset.Control {
  constructor(public execution: string) {
    super();
  }
}
