import { ClassicPreset } from "rete";
import { EnabledControl, NameControl, PluginControl } from "../controls/common-custom-control";
import { FilterColorControl } from "../controls/filter-custom-control";

export class PseudoNodeControl extends ClassicPreset.Control {
  constructor(public pseudoConnection: boolean) {
    super();
  }
}

export class Filter extends ClassicPreset.Node {
  height = 90;
  width = 198;
  parent?: string;
  pseudoNode?: boolean;

  constructor(socket: ClassicPreset.Socket, filter, pseudoNode: boolean) {
    super("Filter");
    this.pseudoNode = pseudoNode;
    const nameControl = new NameControl(filter.filterName);
    const pluginControl = new PluginControl(filter.pluginName);
    const enabledControl = new EnabledControl(filter.enabled);
    const filterColorControl = new FilterColorControl(filter.color);
    const pseudoNodeControl = new PseudoNodeControl(false);

    this.addControl('pseudoNodeControl', pseudoNodeControl);
    this.addControl('nameControl', nameControl);
    this.addControl('pluginControl', pluginControl);
    this.addControl('filterColorControl', filterColorControl);
    this.addControl('enabledControl', enabledControl);
    if (!this.pseudoNode) {
      this.addInput("port", new ClassicPreset.Input(socket));
      this.addOutput("port", new ClassicPreset.Output(socket));
    }
  }
}
