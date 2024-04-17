import { ClassicPreset } from "rete";

export class RuleControl extends ClassicPreset.Control {
    constructor(public pluginName: string) {
      super();
    }
}

export class ChannelControl extends ClassicPreset.Control {
    constructor(public pluginName: string) {
      super();
    }
}

