import { ClassicPreset } from "rete";

export class AddNotification extends ClassicPreset.Node {
  height = 100;
  width = 200;
  parent?: string;

  constructor() {
    super("AddNotification");
  }
}
