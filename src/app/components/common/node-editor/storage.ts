import { ClassicPreset } from "rete";


export class Storage extends ClassicPreset.Node {
    height = 150;
    width = 100;
    parent?: string;

    constructor(socket: ClassicPreset.Socket) {
        super("Storage");

        this.addInput("port", new ClassicPreset.Input(socket));
    }
}