import { ClassicPreset } from "rete";
import {
  EnabledControl,
  NameControl
} from "../controls/common-custom-control";
import { RuleControl, ChannelControl, NotificationTypeControl, ServiceStatusControl } from "../controls/notification-custom-control";

export class Notification extends ClassicPreset.Node {
  height = 92;
  width = 198;
  parent?: string;

  constructor(socket: ClassicPreset.Socket, notification) {
    super("Notification");
    this.addInput("port", new ClassicPreset.Input(socket));
    if (notification) {
      const name = new NameControl(notification.name);
      const deliveryPlugin = new ChannelControl(notification.channel);
      const rulePlugin = new RuleControl(notification.rule);
      const enabled = new EnabledControl(notification.enable);
      const notificationType = new NotificationTypeControl(notification.notificationType);
      const serviceStatus = new ServiceStatusControl(notification.isServiceEnabled);

      this.addControl('nameControl', name);
      this.addControl('channelControl', deliveryPlugin);
      this.addControl('ruleControl', rulePlugin);
      this.addControl('enabledControl', enabled);
      this.addControl('notificationTypeControl', notificationType);
      this.addControl('serviceStatusControl', serviceStatus);
    }
  }
}
