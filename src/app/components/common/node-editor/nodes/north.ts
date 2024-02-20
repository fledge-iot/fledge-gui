import { ClassicPreset } from "rete";
import {
  EnabledControl,
  NameControl,
  PluginControl,
  StatusControl
} from "../controls/common-custom-control";
import { SentReadingsControl } from "../controls/north-custom-control";

export class North extends ClassicPreset.Node {
  height = 110;
  width = 220;
  parent?: string;

  constructor(socket: ClassicPreset.Socket, task) {
    super("North");
    this.addInput("port", new ClassicPreset.Input(socket));
    if (task) {
      const nameControl = new NameControl(task.name);
      const pluginControl = new PluginControl(task.plugin.name);
      const sentReadingControl = new SentReadingsControl(task.sent);
      const statusControl = new StatusControl(task?.status);
      const enabledControl = new EnabledControl(task.enabled);

      this.addControl('nameControl', nameControl);
      this.addControl('pluginControl', pluginControl);
      this.addControl('statusControl', statusControl);
      this.addControl('sentReadingControl', sentReadingControl);
      this.addControl('enabledControl', enabledControl);
    }
  }
}
