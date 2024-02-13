import { ClassicPreset } from "rete";


export class North extends ClassicPreset.Node {
  height = 115;
  width = 220;
  parent?: string;

  constructor(socket: ClassicPreset.Socket, task) {
    super("North");
    console.log('North', task);

    if (task) {
      this.addControl(task.name, new ClassicPreset.InputControl("text"));
      this.addControl("plname" + task.plugin.name, new ClassicPreset.InputControl("text"));
      // let assetCount = service.assets.length;
      let sentReadings = task.sent;
      //this.addControl("asc" + assetCount, new ClassicPreset.InputControl("text"));
      this.addControl("sent" + sentReadings, new ClassicPreset.InputControl("text"));
      // this.addControl(task?.status, new ClassicPreset.InputControl("text"));
      this.addControl(task.enabled, new ClassicPreset.InputControl("text"));
    }
    this.addOutput("port", new ClassicPreset.Output(socket));
  }
}
