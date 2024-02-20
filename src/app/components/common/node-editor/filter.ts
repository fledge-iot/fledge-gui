import { ClassicPreset } from "rete";
import { EnabledControl, NameControl, PluginControl } from "./controls/common-custom-control";
import { FilterColorControl } from "./controls/filter-custom-control";


export class Filter extends ClassicPreset.Node {
  height = 100;
  width = 200;
  parent?: string;

  constructor(socket: ClassicPreset.Socket, filterConfig) {
    super("Filter");

    // this.addControl(filterConfig.filterName, new ClassicPreset.InputControl("text"));
    // this.addControl("plname" + filterConfig.pluginName, new ClassicPreset.InputControl("text"));
    // this.addControl(filterConfig.enabled, new ClassicPreset.InputControl("text"));
    // this.addControl(filterConfig.color, new ClassicPreset.InputControl("text"));
    // this.addInput("port", new ClassicPreset.Input(socket));
    // this.addOutput("port", new ClassicPreset.Output(socket));

    const nameControl = new NameControl(filterConfig.filterName);
    const pluginControl = new PluginControl(filterConfig.pluginName);
    const enabledControl = new EnabledControl(filterConfig.enabled);
    const filterColorControl = new FilterColorControl(filterConfig.color);

    this.addControl('nameControl', nameControl);
    this.addControl('pluginControl', pluginControl);
    this.addControl('filterColorControl', filterColorControl);
    this.addControl('enabledControl', enabledControl);
    this.addInput("port", new ClassicPreset.Input(socket));
    this.addOutput("port", new ClassicPreset.Output(socket));
  }
}
