import { ClassicPreset } from "rete";


export class South extends ClassicPreset.Node {
    height = 110;
    width = 220;
    parent?: string;

    constructor(socket: ClassicPreset.Socket, service) {
        super("South");

        if (service) {
            this.addControl(service.name, new ClassicPreset.InputControl("text"));
            this.addControl(service.plugin.name, new ClassicPreset.InputControl("text"));
            let assetCount = service.assets.length;
            let readingCount = service.assets.reduce((total, asset) => {
                return total + asset.count;
            }, 0)
            this.addControl("asc" + assetCount, new ClassicPreset.InputControl("text"));
            this.addControl("rdc" + readingCount, new ClassicPreset.InputControl("text"));
            this.addControl(service.status, new ClassicPreset.InputControl("text"));
            if(service.status){
                this.addControl(service.protocol, new ClassicPreset.InputControl("text"));
                this.addControl(service.address, new ClassicPreset.InputControl("text"));
                this.addControl("mgt" + service.management_port, new ClassicPreset.InputControl("text"));
            }
        }
        this.addOutput("port", new ClassicPreset.Output(socket));
    }
}