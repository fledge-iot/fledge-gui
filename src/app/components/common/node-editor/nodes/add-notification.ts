import { ClassicPreset } from "rete";

export class AddNotification extends ClassicPreset.Node {
  height = 100;
  width = 198;
  parent?: string;

  constructor() {
    super("AddNotification");
  }
}
