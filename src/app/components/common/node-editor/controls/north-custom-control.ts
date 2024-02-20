import { ClassicPreset } from "rete";

export class SentReadingsControl extends ClassicPreset.Control {
  constructor(public sent: string) {
    super();
  }
}
