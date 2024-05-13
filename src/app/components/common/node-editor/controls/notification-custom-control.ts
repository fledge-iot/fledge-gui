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

export class NotificationTypeControl extends ClassicPreset.Control {
    constructor(public type: string) {
      super();
    }
}

export class ServiceStatusControl extends ClassicPreset.Control {
  constructor(public enabled: boolean) {
    super();
  }
}

