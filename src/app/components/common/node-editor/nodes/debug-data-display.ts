import { ClassicPreset } from "rete";
import { DebugDataDisplayControl } from "../controls/debug-data-display-control";

export class DebugDataDisplay extends ClassicPreset.Node {
  height = 250;
  width = 394; // 75% of 525px
  type? = "debug-data-display";
  nodeName: string;
  debugData: any;

  constructor(socket: ClassicPreset.Socket, nodeName: string, debugData: any) {
    super("Debug Data Display");
    this.nodeName = nodeName;
    this.debugData = debugData;
    
    const debugDataDisplayControl = new DebugDataDisplayControl(nodeName, debugData);
    this.addControl('debugDataDisplayControl', debugDataDisplayControl);
    
    // Add output port to connect to the input port of the node whose data is being displayed
    this.addOutput("port", new ClassicPreset.Output(socket));
  }
}

