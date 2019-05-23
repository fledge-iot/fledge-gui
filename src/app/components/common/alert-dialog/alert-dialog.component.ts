import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-alert-dialog',
  templateUrl: './alert-dialog.component.html',
  styleUrls: ['./alert-dialog.component.css']
})
export class AlertDialogComponent implements OnInit, OnChanges {
  @Input() notificationRecord: { name: string, message: string, key: string, headerTextValue: any };
  @Input() notificationServiceRecord: { name: string, message: string, key: string, headerTextValue: any };
  @Input() childData: { id: Number, name: any, key: any, message: any, actionButtonValue: any, headerTextValue: any};
  @Input() serviceRecord: { port: Number, key: any, name: any, message: any, protocol: string, headerTextValue: any };
  @Input() deleteTaskData: { name: any, message: any, key: any, headerTextValue: any };
  @Output() delete = new EventEmitter<Number>();
  @Output() deleteService = new EventEmitter<Object>();
  @Output() deleteNotification = new EventEmitter<Object>();
  @Output() disableNotificationService = new EventEmitter<Object>();
  @Output() deleteTask = new EventEmitter<Object>();
  @Output() deleteUserService = new EventEmitter<Number>();
  @Output() deleteCertificate = new EventEmitter<Object>();
  @Output() logoutUserService = new EventEmitter<Number>();
  @Output() createBackup = new EventEmitter<Number>();
  @Output() restoreBackup = new EventEmitter<Number>();
  @Output() deleteBackup = new EventEmitter<Number>();
  @Output() logoutAllUserSessionsService = new EventEmitter<Number>();

  constructor() { }

  ngOnInit() { }

  ngOnChanges() {
    if (this.childData) {
      if (this.childData.key === 'restoreBackup') {
        this.childData.actionButtonValue = 'Restore';
        this.childData.headerTextValue = 'Restore Backup';
      }
      if (this.childData.key === 'deleteBackup') {
        this.childData.actionButtonValue = 'Delete';
        this.childData.headerTextValue = 'Delete Backup';
      }
      if (this.childData.key === 'deleteCertificate') {
        this.childData.actionButtonValue = 'Delete';
        this.childData.headerTextValue = 'Delete Certificate';
      }
      if (this.childData.key === 'deleteKey') {
        this.childData.actionButtonValue = 'Delete';
        this.childData.headerTextValue = 'Delete Key';
      }
      if (this.childData.key === 'deleteUser') {
        this.childData.actionButtonValue = 'Delete';
        this.childData.headerTextValue = 'Delete User';
      }
      if (this.childData.key === 'logout') {
        this.childData.actionButtonValue = 'Log Out';
      }
      if (this.childData.key === 'clearSessions') {
        this.childData.actionButtonValue = 'Clear Sessions';
        this.childData.headerTextValue = 'Clear Sessions';
      }
      if (this.childData.key === 'createBackup') {
        this.childData.actionButtonValue = 'Create';
      }
    }
    if (this.serviceRecord) {
      if (this.serviceRecord.key === 'deleteService') {
        this.serviceRecord.headerTextValue = 'Delete Service';
      }
    }
    if (this.deleteTaskData) {
      if (this.deleteTaskData.key === 'deleteTask') {
        this.deleteTaskData.headerTextValue = 'Delete Instance';
      }
    }
    if (this.notificationRecord) {
      if (this.notificationRecord.key === 'deleteNotification') {
        this.notificationRecord.headerTextValue = 'Delete Instance';
      }
    }
    if (this.notificationServiceRecord) {
      if (this.notificationServiceRecord.key === 'disableNotification') {
       this.notificationServiceRecord.headerTextValue = 'Disable Service';
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
      if (this.childData.key === 'deleteUser') {
        this.deleteUserService.emit(this.childData.id);
        this.toggleModal(false);
      }
      if (this.childData.key === 'deleteCertificate') {
        this.deleteCertificate.emit({name: this.childData.name, type: 'cert'});
        this.toggleModal(false);
      }
      if (this.childData.key === 'deleteKey') {
        this.deleteCertificate.emit({name: this.childData.name, type: 'key'});
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
    if (this.serviceRecord) {
      if (this.serviceRecord.key === 'deleteService') {
        const serviceInfo = {
          port: this.serviceRecord.port,
          protocol: this.serviceRecord.protocol,
          name: this.serviceRecord.name
        };
        this.deleteService.emit(serviceInfo);
        this.toggleModal(false);
      }
    }
    if (this.notificationRecord) {
      if (this.notificationRecord.key === 'deleteNotification') {
        this.deleteNotification.emit(this.notificationRecord.name);
        this.toggleModal(false);
      }
    }
    if (this.notificationServiceRecord) {
      if (this.notificationServiceRecord.key === 'disableNotification') {
        this.disableNotificationService.emit();
        this.toggleModal(false);
      }
    }
    if (this.deleteTaskData) {
      if (this.deleteTaskData.key === 'deleteTask') {
        this.deleteTask.emit({
          name: this.deleteTaskData.name
        });
        this.toggleModal(false);
      }
    }
  }
}
