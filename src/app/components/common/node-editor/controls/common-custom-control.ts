import { ClassicPreset } from "rete";

export class NameControl extends ClassicPreset.Control {
  constructor(public name: string) {
    super();
  }
}

export class PluginControl extends ClassicPreset.Control {
  constructor(public plugin: string) {
    super();
  }
}

export class PluginVersionControl extends ClassicPreset.Control {
  constructor(public pluginVersion: string) {
    super();
  }
}

export class StatusControl extends ClassicPreset.Control {
  constructor(public status: string) {
    super();
  }
}

export class EnabledControl extends ClassicPreset.Control {
  constructor(public enabled: boolean) {
    super();
  }
}
