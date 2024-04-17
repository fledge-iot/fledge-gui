import { ClassicPreset } from "rete";


export class AddService extends ClassicPreset.Node {
  height = 100;
  width = 200;
  parent?: string;

  constructor() {
    super("AddService");
  }
}
