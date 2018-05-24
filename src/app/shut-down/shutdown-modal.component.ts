import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import { SchedulesService, AlertService } from '../services/index';

@Component({
  selector: 'shutdown-modal',
  templateUrl: './shutdown-modal.component.html'
})
export class ShutdownModalComponent implements OnInit {
  @Input() shutDownData: { key: any, message: any };
  @Output() shutdown = new EventEmitter<Number>();

  constructor(private schedulesService: SchedulesService, private alertService: AlertService) { }

  ngOnInit() { }

  public toggleModal(isOpen: Boolean) {
    const modal_name = <HTMLDivElement>document.getElementById('shutdownModal-box');
    if (isOpen) {
      modal_name.classList.add('is-active');
      return;
    }
    modal_name.classList.remove('is-active');
  }


  triggerAction() {
    if (this.shutDownData.key === 'shutdown') {
      this.shutdown.emit();
      this.toggleModal(false);
    }
  }
}
