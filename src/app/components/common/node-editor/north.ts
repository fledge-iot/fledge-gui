import { ClassicPreset } from "rete";


export class North extends ClassicPreset.Node {
  height = 110;
  width = 220;
  parent?: string;

  constructor(socket: ClassicPreset.Socket, task) {
    super("North");
    this.addInput("port", new ClassicPreset.Input(socket));
    if (task) {
      this.addControl(task.name, new ClassicPreset.InputControl("text"));
      this.addControl("plname" + task.plugin.name, new ClassicPreset.InputControl("text"));
      let sentReadings = task.sent;
      this.addControl("sent" + sentReadings, new ClassicPreset.InputControl("text"));
      // this.addControl(task?.status, new ClassicPreset.InputControl("text"));
      this.addControl(task.enabled, new ClassicPreset.InputControl("text"));
    }
    this.addOutput("port", new ClassicPreset.Output(socket));
  }
}
