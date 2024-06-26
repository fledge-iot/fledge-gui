import { ClassicPreset } from "rete";
import {
  AssetControl,
  ReadingControl,
} from "../controls/south-custom-control";
import {
  EnabledControl,
  NameControl,
  PluginControl,
  PluginVersionControl,
  StatusControl
} from "../controls/common-custom-control";

export class South extends ClassicPreset.Node {
  height = 94;
  width = 198;
  parent?: string;

  constructor(socket: ClassicPreset.Socket, service) {
    super("South");
    if (service) {
      let assetCount = service.assets.length;
      let readingCount = service.assets.reduce((total, asset) => {
        return total + asset.count;
      }, 0)

      const nameControl = new NameControl(service.name);
      const pluginControl = new PluginControl(service.plugin.name);
      const statusControl = new StatusControl(service.status);
      const enabledControl = new EnabledControl(service.schedule_enabled);
      const readingCountControl = new ReadingControl(readingCount);
      const assetCountControl = new AssetControl(assetCount);
      const pluginVersion = new PluginVersionControl(service.plugin.version);

      this.addControl('nameControl', nameControl);
      this.addControl('pluginControl', pluginControl);
      this.addControl('readingCountControl', readingCountControl);
      this.addControl('assetCountControl', assetCountControl);
      this.addControl('statusControl', statusControl);
      this.addControl('enabledControl', enabledControl);
      this.addControl('pluginVersionControl', pluginVersion);
    }
    this.addOutput("port", new ClassicPreset.Output(socket));
  }
}
