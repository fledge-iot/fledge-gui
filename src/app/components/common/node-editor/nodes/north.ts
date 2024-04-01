import { ClassicPreset } from "rete";
import {
  EnabledControl,
  NameControl,
  PluginControl,
  PluginVersionControl,
  StatusControl
} from "../controls/common-custom-control";
import { ExecutionControl, SentReadingsControl } from "../controls/north-custom-control";

export class North extends ClassicPreset.Node {
  height = 94;
  width = 198;
  parent?: string;

  constructor(socket: ClassicPreset.Socket, task) {
    super("North");
    this.addInput("port", new ClassicPreset.Input(socket));
    if (task) {
      const name = new NameControl(task.name);
      const plugin = new PluginControl(task.plugin.name);
      const sentReading = new SentReadingsControl(task.sent);
      const status = new StatusControl(task?.status);
      const execution = new ExecutionControl(task?.execution);
      const enabled = new EnabledControl(task.enabled);
      const pluginVersion = new PluginVersionControl(task.plugin.version);

      this.addControl('nameControl', name);
      this.addControl('pluginControl', plugin);
      this.addControl('statusControl', status);
      this.addControl('executionControl', execution);
      this.addControl('sentReadingControl', sentReading);
      this.addControl('enabledControl', enabled);
      this.addControl('pluginVersionControl', pluginVersion);
    }
  }
}
