import { ClassicPreset } from "rete";


export class AddTask extends ClassicPreset.Node {
  height = 110;
  width = 220;
  parent?: string;

  constructor() {
    super("AddTask");
  }
}
