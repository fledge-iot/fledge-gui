import { ClassicPreset } from "rete";
import { ServiceStatusControl } from "../controls/notification-custom-control";

export class AddNotification extends ClassicPreset.Node {
  height = 100;
  width = 198;
  parent?: string;

  constructor(isServiceAvailable) {
    super("AddNotification");
    const serviceStatus = new ServiceStatusControl(isServiceAvailable);
    this.addControl('serviceStatusControl', serviceStatus);
  }
}
