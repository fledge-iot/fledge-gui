import { Component, OnInit, OnChanges, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-alert-dialog',
  templateUrl: './alert-dialog.component.html'
})
export class AlertDialogComponent implements OnInit, OnChanges {
  @Input() childData: { id: Number, name: any, key: any, message: any, actionButtonValue: any};
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

  constructor() { }

  ngOnInit() { }

  ngOnChanges() {
    if (this.childData.key === 'restoreBackup') {
      this.childData.actionButtonValue = 'Restore';
    }
    if (this.childData.key === 'deleteBackup' || this.childData.key === 'deleteCertificate' || this.childData.key === 'deleteUser') {
      this.childData.actionButtonValue = 'Delete';
    }
    if (this.childData.key === 'logout' || this.childData.key === 'clearSessions') {
      this.childData.actionButtonValue = 'Log Out';
    }
    if (this.childData.key === 'clearSessions') {
      this.childData.actionButtonValue = 'Clear Sessions';
    }
    if (this.childData.key === 'createBackup') {
      this.childData.actionButtonValue = 'Create';
    }
  }

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
