import { ClassicPreset } from "rete";


export class Filter extends ClassicPreset.Node {
    height = 150;
    width = 200;
    parent?: string;

    constructor(socket: ClassicPreset.Socket, nodeName) {
        super("Filter");

        this.addControl(nodeName, new ClassicPreset.InputControl("text", { initial: nodeName }));
        this.addInput("port", new ClassicPreset.Input(socket));
        this.addOutput("port", new ClassicPreset.Output(socket));
    }
}