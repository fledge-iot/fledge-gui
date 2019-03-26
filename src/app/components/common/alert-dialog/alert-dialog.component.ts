import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-alert-dialog',
  templateUrl: './alert-dialog.component.html'
})
export class AlertDialogComponent implements OnInit, OnChanges {
  @Input() childData: { id: Number, name: any, key: any, message: any, actionButtonValue: any };
  @Input() serviceRecord: { port: Number, key: any, name: any, message: any, protocol: string };
  @Input() deleteTaskData: { name: any, message: any, key: any };
  @Output() delete = new EventEmitter<Number>();
  @Output() deleteService = new EventEmitter<Object>();
  @Output() deleteTask = new EventEmitter<Object>();
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
    if (this.childData) {
      if (this.childData.key === 'Restore Backup') {
        this.childData.actionButtonValue = 'Restore';
      }
      if (this.childData.key === 'Delete Backup' || this.childData.key === 'Delete Certificate' || this.childData.key === 'Delete User') {
        this.childData.actionButtonValue = 'Delete';
      }
      if (this.childData.key === 'logout') {
        this.childData.actionButtonValue = 'Log Out';
      }
      if (this.childData.key === 'Clear Sessions') {
        this.childData.actionButtonValue = 'Clear Sessions';
      }
      if (this.childData.key === 'createBackup') {
        this.childData.actionButtonValue = 'Create';
      }
    }
  }

  public toggleModal(isOpen: Boolean) {
    const alertModal = <HTMLDivElement>document.getElementById('modal-box');
    if (isOpen) {
      alertModal.classList.add('is-active');
      return;
    }
    alertModal.classList.remove('is-active');
  }

  triggerAction() {
    if (this.childData) {
      if (this.childData.key === 'delete') {
        this.delete.emit(this.childData.id);
        this.toggleModal(false);
      }
      if (this.childData.key === 'Delete User') {
        this.deleteUserService.emit(this.childData.id);
        this.toggleModal(false);
      }
      if (this.childData.key === 'Delete Certificate') {
        this.deleteCertificate.emit(this.childData.name);
        this.toggleModal(false);
      }
      if (this.childData.key === 'Clear Sessions') {
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
      if (this.childData.key === 'Restore Backup') {
        this.restoreBackup.emit(this.childData.id);
        this.toggleModal(false);
      }
      if (this.childData.key === 'Delete Backup') {
        this.deleteBackup.emit(this.childData.id);
        this.toggleModal(false);
      }
    }
    if (this.serviceRecord) {
      if (this.serviceRecord.key === 'Delete Service') {
        const serviceInfo = {
          port: this.serviceRecord.port,
          protocol: this.serviceRecord.protocol,
          name: this.serviceRecord.name
        };
        this.deleteService.emit(serviceInfo);
        this.toggleModal(false);
      }
    }
    if (this.deleteTaskData) {
      if (this.deleteTaskData.key === 'Delete Task') {
        this.deleteTask.emit({
          name: this.deleteTaskData.name
        });
        this.toggleModal(false);
      }
    }
  }
}
