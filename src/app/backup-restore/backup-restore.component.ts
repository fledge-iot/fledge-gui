import { Component, OnInit, ViewChild } from '@angular/core';
import { BackupRestoreService, AlertService } from '../services/index';
import { ModalComponent } from '../modal/modal.component';
import { NgProgress } from 'ngx-progressbar';

@Component({
  selector: 'app-backup-restore',
  templateUrl: './backup-restore.component.html',
  styleUrls: ['./backup-restore.component.css']
})
export class BackupRestoreComponent implements OnInit {
  public backupData = [];

  // Object to hold data of certificate to delete
  public childData = {
    id: '',
    name: '',
    message: '',
    key: ''
  };

  @ViewChild(ModalComponent) child: ModalComponent;

  constructor( private backupRestoreService: BackupRestoreService, public ngProgress: NgProgress, private alertService: AlertService ) { }

  ngOnInit() {
    this.getBackup();
  }

  /**
  * Open modal
  */
  openModal(id, name, message, key) {
    this.childData = {
      id: id,
      name: name,
      message: message,
      key: key
    };
    // call child component method to toggle modal
    this.child.toggleModal(true);
  }


  public getBackup() {
    this.ngProgress.start();
    this.backupRestoreService.get().
    subscribe(
      data => {
        this.ngProgress.done();
        this.backupData = data.backups;
      },
      error => {
        this.ngProgress.done();
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      }
    );
  }

  public requestBackup() {
    this.ngProgress.start();
    this.backupRestoreService.requestBackup().
    subscribe(
      data => {
        this.ngProgress.done();
        this.alertService.success("Backup created successfully");
        this.getBackup();
      },
      error => {
        this.ngProgress.done();
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      }
    );
  }

  public restoreBackup(id) {
    this.ngProgress.start();
    this.backupRestoreService.restoreBackup(id).
    subscribe(
      data => {
        this.ngProgress.done();
        this.alertService.success("Restored successfully");
        this.getBackup();
      },
      error => {
        this.ngProgress.done();
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      }
    );
  }

  public deleteBackup(id) {
    this.ngProgress.start();
    this.backupRestoreService.deleteBackup(id).
    subscribe(
      data => {
        this.ngProgress.done();
        this.alertService.success("Backup deleted successfully");
        this.getBackup();
      },
      error => {
        this.ngProgress.done();
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      }
    );
  }
}
