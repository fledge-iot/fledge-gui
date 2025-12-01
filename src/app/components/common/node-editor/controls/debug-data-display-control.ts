import { ClassicPreset } from "rete";

export class DebugDataDisplayControl extends ClassicPreset.Control {
  constructor(public nodeName: string, public debugData: any) {
    super();
  }
}

