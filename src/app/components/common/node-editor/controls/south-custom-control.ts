import { ClassicPreset } from "rete";

export class ReadingControl extends ClassicPreset.Control {
  constructor(public count: string) {
    super();
  }
}

export class AssetControl extends ClassicPreset.Control {
  constructor(public count: string) {
    super();
  }
}
