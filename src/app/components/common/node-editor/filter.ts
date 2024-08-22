import { ClassicPreset } from "rete";
import { EnabledControl, NameControl, PluginControl } from "./controls/common-custom-control";
import { FilterColorControl } from "./controls/filter-custom-control";


export class Filter extends ClassicPreset.Node {
  height = 90;
  width = 198;
  parent?: string;

  constructor(socket: ClassicPreset.Socket, filter) {
    super("Filter");
    const nameControl = new NameControl(filter.filterName);
    const pluginControl = new PluginControl(filter.pluginName);
    const enabledControl = new EnabledControl(filter.enabled);
    const filterColorControl = new FilterColorControl(filter.color);


    this.addControl('nameControl', nameControl);
    this.addControl('pluginControl', pluginControl);
    this.addControl('filterColorControl', filterColorControl);
    this.addControl('enabledControl', enabledControl);
    this.addInput("port", new ClassicPreset.Input(socket));
    this.addOutput("port", new ClassicPreset.Output(socket));

  }
}
