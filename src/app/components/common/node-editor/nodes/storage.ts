import { ClassicPreset } from "rete";
import { DebugControl } from "../controls/common-custom-control";
import { Debug } from "../../../../components/core/south/south-service";


export class Storage extends ClassicPreset.Node {
  height = 50;
  width = 100;
  parent?: string;
  debug?: Debug;

  constructor(socket: ClassicPreset.Socket, data) {
    super("Storage");
    if (data.from == 'south' && data?.service?.debug) {
      const debug = new DebugControl(data.service.debug);
      this.addControl('debugControl', debug);
      this.debug = data.service.debug;
    }

    this.addInput("port", new ClassicPreset.Input(socket));
    this.addOutput("port", new ClassicPreset.Output(socket));
  }
}
