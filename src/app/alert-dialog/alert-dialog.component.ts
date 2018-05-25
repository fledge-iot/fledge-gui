import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import { SchedulesService, UserService, AlertService } from '../services/index';

@Component({
  selector: 'app-alert-dialog',
  templateUrl: './alert-dialog.component.html'
})
export class AlertDialogComponent implements OnInit {
  @Input() childData: { id: Number, name: any, key: any, message: any };
  @Input() shutDownServiceData: { port: Number, key: any, message: any, protocol: string, address: string };
  @Output() enable = new EventEmitter<Number>();
  @Output() disable = new EventEmitter<Number>();
  @Output() delete = new EventEmitter<Number>();
  @Output() shutdownService = new EventEmitter<Object>();
  @Output() deleteUserService = new EventEmitter<Number>();
  @Output() deleteCertificate = new EventEmitter<Number>();
  @Output() logoutUserService = new EventEmitter<Number>();
  @Output() createBackup = new EventEmitter<Number>();
  @Output() restoreBackup = new EventEmitter<Number>();
  @Output() deleteBackup = new EventEmitter<Number>();
  @Output() logoutAllUserSessionsService = new EventEmitter<Number>();

  constructor(private schedulesService: SchedulesService,
    private alertService: AlertService,
    private userService: UserService) { }

  ngOnInit() {}

  public toggleModal(isOpen: Boolean) {
    const schedule_name = <HTMLDivElement>document.getElementById('modal-box');
    if (isOpen) {
      schedule_name.classList.add('is-active');
      return;
    }
    schedule_name.classList.remove('is-active');
  }

  triggerAction() {
    if (this.childData) {
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
      if (this.childData.key === 'deleteUser') {
        this.deleteUserService.emit(this.childData.id);
        this.toggleModal(false);
      }
      if (this.childData.key === 'deleteCertificate') {
        this.deleteCertificate.emit(this.childData.name);
        this.toggleModal(false);
      }
      if (this.childData.key === 'clearSessions') {
        this.logoutAllUserSessionsService.emit(this.childData.id);
        this.toggleModal(false);
      }
      if (this.childData.key === 'logout') {
        this.logoutUserService.emit();
        this.toggleModal(false);
      }
      if (this.childData.key === 'createBackup') {
        this.createBackup.emit();
        this.toggleModal(false);
      }
      if (this.childData.key === 'restoreBackup') {
        this.restoreBackup.emit(this.childData.id);
        this.toggleModal(false);
      }
      if (this.childData.key === 'deleteBackup') {
        this.deleteBackup.emit(this.childData.id);
        this.toggleModal(false);
      }
    }
    if (this.shutDownServiceData) {
      if (this.shutDownServiceData.key === 'shutdownService') {
        const serviceInfo = {
          port: this.shutDownServiceData.port,
          protocol: this.shutDownServiceData.protocol,
          address: this.shutDownServiceData.address
        };
        this.shutdownService.emit(serviceInfo);
        this.toggleModal(false);
      }
    }
  }
}
