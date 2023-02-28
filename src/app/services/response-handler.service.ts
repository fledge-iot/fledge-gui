import { Injectable } from '@angular/core';
import { ToastService } from './toast.service';

@Injectable(
  { providedIn: "root" }
)
export class ResponseHandler {

  constructor(private toastService: ToastService) { }

  handleResponseMessage(type: string) {
    if (type === 'schedule') {
      this.toastService.success('Schedule updated successfully.')
    } else if (type === 'plugin-config')
      this.toastService.success('Configuration updated successfully.');
    else if (type === 'filter-config') {
      this.toastService.success('Filter configuration updated successfully.');
    }
  }
}
