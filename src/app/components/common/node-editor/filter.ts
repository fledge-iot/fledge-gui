import { ClassicPreset } from "rete";


export class Filter extends ClassicPreset.Node {
    height = 115;
    width = 200;
    parent?: string;

    constructor(socket: ClassicPreset.Socket, filterConfig) {
        super("Filter");

        this.addControl(filterConfig.filterName, new ClassicPreset.InputControl("text"));
        this.addControl(filterConfig.pluginName, new ClassicPreset.InputControl("text"));
        this.addControl(filterConfig.enabled, new ClassicPreset.InputControl("text"));
        this.addControl(filterConfig.color, new ClassicPreset.InputControl("text"));
        this.addInput("port", new ClassicPreset.Input(socket));
        this.addOutput("port", new ClassicPreset.Output(socket));
    }
}