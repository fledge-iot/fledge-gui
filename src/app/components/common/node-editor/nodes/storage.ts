import { ClassicPreset } from "rete";
import { DebugControl } from "../controls/common-custom-control";


export class Storage extends ClassicPreset.Node {
  height = 50;
  width = 100;
  parent?: string;

  constructor(socket: ClassicPreset.Socket, data) {
    super("Storage");
    console.log(data);
    if (data.from == 'south' && data?.service?.debug) {
      const debug = new DebugControl(data.service.debug);
      this.addControl('debugControl', debug);
    }

    this.addInput("port", new ClassicPreset.Input(socket));
    this.addOutput("port", new ClassicPreset.Output(socket));
  }
}
