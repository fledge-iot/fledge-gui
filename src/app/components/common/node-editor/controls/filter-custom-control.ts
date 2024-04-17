import { ClassicPreset } from "rete";

export class FilterColorControl extends ClassicPreset.Control {
  constructor(public color: string) {
    super();
  }
}
