import { ClassicPreset } from "rete";


export class Applications extends ClassicPreset.Node {
    height = 300;
    width = 600;
    parent?: string;

    constructor(socket: ClassicPreset.Socket) {
        super("Applications");

        this.addInput("port", new ClassicPreset.Input(socket));
        this.addOutput("port", new ClassicPreset.Output(socket));
    }
}