import { ClassicPreset } from "rete";


export class Storage extends ClassicPreset.Node {
  height = 50;
  width = 100;
  parent?: string;

  constructor(socket: ClassicPreset.Socket, from: string) {
    super("Storage");
    if (from == 'south') {
      this.addInput("port", new ClassicPreset.Input(socket));
    } else {
      this.addOutput("port", new ClassicPreset.Output(socket));
    }
  }
}
