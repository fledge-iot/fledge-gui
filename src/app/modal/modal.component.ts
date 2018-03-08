import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import { SchedulesService, AlertService } from '../services/index';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html'
})
export class ModalComponent implements OnInit {
  @Input() childData: { id: Number, name: any, key: any, message: any };
  @Output() enable = new EventEmitter<Number>();
  @Output() disable = new EventEmitter<Number>();
  @Output() delete = new EventEmitter<Number>();
  @Output() shutdownService = new EventEmitter<Number>();
  @Output() deleteCertificate = new EventEmitter<Number>();

  constructor(private schedulesService: SchedulesService, private alertService: AlertService) { }

  ngOnInit() { }

  public toggleModal(isOpen: Boolean) {
    let schedule_name = <HTMLDivElement>document.getElementById('modal-box');
    if (isOpen) {
      schedule_name.classList.add('is-active');
      return;
    }
    schedule_name.classList.remove('is-active');
  }


  triggerAction() {
    if (this.childData.key === 'enable') {
      this.enable.emit(this.childData.id);
      this.toggleModal(false);
    }
    if (this.childData.key === 'disable') {
      this.disable.emit(this.childData.id);
      this.toggleModal(false);
    }
    if (this.childData.key === 'delete') {
      this.delete.emit(this.childData.id);
      this.toggleModal(false);
    }
    if (this.childData.key === 'shutdownService') {
      this.shutdownService.emit(this.childData.id);
      this.toggleModal(false);
    }
    if (this.childData.key === 'deleteCertificate') {
      this.deleteCertificate.emit(this.childData.name);
      this.toggleModal(false);
    }
  }
}
