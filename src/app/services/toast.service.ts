import { Injectable } from '@angular/core';
import * as bulmaToast from 'bulma-toast'

export const toastDefaultProperties: bulmaToast.Options = {
  position: 'bottom-right',
  closeOnClick: false,
  dismissible: true,
  animate: { in: 'fadeIn', out: 'fadeOut' },
}

@Injectable({ providedIn: 'root' })
export class ToastService {

  constructor() { }

  /**
   * Success notification
   * @param message The actual message to be displayed. It can be a string, a template string, or a DOM node
   * @param Duration of the notification in milliseconds. Default is 5000 milliseconds.
   */
  success(message: string, duration = 5000) {
    const prop: bulmaToast.Options = { ...toastDefaultProperties, message, type: 'is-success', duration };
    bulmaToast.toast(prop);
  }

  /**
    *  Error notification
    * @param message The actual message to be displayed. It can be a string, a template string, or a DOM node
    * @param Duration of the notification in milliseconds. Default is 15000 milliseconds.
    */
  error(message: string, duration = 15000) {
    const prop: bulmaToast.Options = { ...toastDefaultProperties, message, type: 'is-danger', duration };
    bulmaToast.toast(prop);
  }

  /**
   *  Warning notification
   * @param message The actual message to be displayed. It can be a string, a template string, or a DOM node
   * @param Duration of the notification in milliseconds. Default is 10000 milliseconds.
   */
  warning(message: string, duration = 10000) {
    const prop: bulmaToast.Options = { ...toastDefaultProperties, message, type: 'is-warning', duration };
    bulmaToast.toast(prop);
  }

  /**
  *  Info notification
  * @param message The actual message to be displayed. It can be a string, a template string, or a DOM node
  * @param Duration of the notification in milliseconds. Default is 10000 milliseconds.
  */
  info(message: string, duration = 10000) {
    const prop: bulmaToast.Options = { ...toastDefaultProperties, message, type: 'is-info', duration };
    bulmaToast.toast(prop)
  }

}
