import { Component, OnInit, ViewChild } from '@angular/core';
import { NgProgress } from 'ngx-progressbar';

import { DateFormatterPipe } from '../../../pipes';
import { AlertService } from '../../../services';
import { BackupRestoreService } from '../../../services/backup-restore.service';
import { AlertDialogComponent } from '../../common/alert-dialog/alert-dialog.component';

@Component({
  selector: 'app-backup-restore',
  templateUrl: './backup-restore.component.html',
  styleUrls: ['./backup-restore.component.css']
})
export class BackupRestoreComponent implements OnInit {
  public backupData = [];

  // Object to hold child data
  public childData = {
    id: '',
    name: '',
    message: '',
    key: ''
  };

  @ViewChild(AlertDialogComponent) child: AlertDialogComponent;

  constructor(private backupRestoreService: BackupRestoreService,
    public ngProgress: NgProgress,
    private alertService: AlertService, private dateFormatter: DateFormatterPipe) { }

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
        (data) => {
          this.ngProgress.done();
          this.backupData = data['backups'];
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
        (data) => {
          this.ngProgress.done();
          this.alertService.success(data['status']);
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
        (data) => {
          this.ngProgress.done();
          this.alertService.success(data['status']);
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
        (data) => {
          this.ngProgress.done();
          this.alertService.success(data['message']);
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

  public async downloadBackup(backup): Promise<void> {
    const blob = await this.backupRestoreService.downloadBackup(backup.id);
    const url = window.URL.createObjectURL(blob);
    // create a custom anchor tag
    const a = document.createElement('a');
    a.href = url;
    const date = this.dateFormatter.transform(backup.date, 'YYYY_MM_DD_HH_mm_ss');
    a.download = 'foglamp_backup_' + date + '.tar.gz';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
