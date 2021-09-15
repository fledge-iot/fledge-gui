import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { interval, Subject, Subscription } from 'rxjs';
import { takeUntil, takeWhile } from 'rxjs/operators';
import { DateFormatterPipe } from '../../../pipes';
import { AlertService, PingService, ProgressBarService, SharedService } from '../../../services';
import { BackupRestoreService } from '../../../services/backup-restore.service';
import { DocService } from '../../../services/doc.service';
import { POLLING_INTERVAL } from '../../../utils';
import { AlertDialogComponent } from '../../common/alert-dialog/alert-dialog.component';
import { FileUploadModalComponent } from '../../common/file-upload-modal/file-upload-modal.component';

@Component({
  selector: 'app-backup-restore',
  templateUrl: './backup-restore.component.html',
  styleUrls: ['./backup-restore.component.css']
})
export class BackupRestoreComponent implements OnInit, OnDestroy {
  public backupData = [];
  private isAlive: boolean; // used to unsubscribe from the IntervalObservable
  // when OnDestroy is called.

  // Object to hold child data
  public childData = {
    id: '',
    name: '',
    message: '',
    key: ''
  };
  public showSpinner = false;
  public refreshInterval = POLLING_INTERVAL;
  private viewPortSubscription: Subscription;
  viewPort: any = '';

  @ViewChild(AlertDialogComponent, { static: true }) child: AlertDialogComponent;
  @ViewChild(FileUploadModalComponent, { static: true }) fileUploadModal: FileUploadModalComponent;

  destroy$: Subject<boolean> = new Subject<boolean>();

  ascSort = false;

  constructor(private backupRestoreService: BackupRestoreService,
    private alertService: AlertService,
    private sharedService: SharedService,
    public ngProgress: ProgressBarService,
    private dateFormatter: DateFormatterPipe,
    private docService: DocService,
    private ping: PingService) {
    this.isAlive = true;
    this.ping.pingIntervalChanged
      .pipe(takeUntil(this.destroy$))
      .subscribe((timeInterval: number) => {
        if (timeInterval === -1) {
          this.isAlive = false;
        }
        this.refreshInterval = timeInterval;
      });
  }

  ngOnInit() {
    this.getBackup();
    interval(this.refreshInterval)
      .pipe(takeWhile(() => this.isAlive), takeUntil(this.destroy$)) // only fires when component is alive
      .subscribe(() => {
        this.getBackup();
      });
    this.viewPortSubscription = this.sharedService.viewport.subscribe(viewport => {
      this.viewPort = viewport;
    });
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

  sort() {
    this.ascSort = !this.ascSort;
    this.sortBackups();
  }

  sortBackups() {
    if (this.ascSort) {
      // For ascending sort
      this.backupData = this.backupData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else {
      // For descending sort
      this.backupData = this.backupData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  }

  public getBackup() {
    this.backupRestoreService.get()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data) => {
          this.backupData = data['backups'];
          if (this.backupData.length > 1) {
            this.sortBackups();
          }
          this.hideLoadingSpinner();
        },
        error => {
          this.hideLoadingSpinner();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        }
      );
  }

  public requestBackup() {
    if (this.backupData.length === 0) {
      this.showLoadingSpinner();
    }
    this.backupRestoreService.requestBackup()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data) => {
          this.alertService.info(data['status']);
        },
        error => {
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
    this.backupRestoreService.restoreBackup(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data) => {
          this.alertService.info(data['status']);
          this.getBackup();
          this.ngProgress.done();
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

  public deleteBackup(id: any) {
    this.ngProgress.start();
    this.backupRestoreService.deleteBackup(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data) => {
          this.ngProgress.done();
          this.alertService.success(data['message']);
          // Remove from local array of backups
          this.backupData = this.backupData.filter(b => b.id !== id);
          // reset sort to default
          if(this.backupData.length === 1){
            this.ascSort = false;
          }
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

  uploadBackup() {
    this.fileUploadModal.toggleModal(true);
  }

  public async downloadBackup(backup): Promise<void> {
    const blob = await this.backupRestoreService.downloadBackup(backup.id);
    const url = window.URL.createObjectURL(blob);
    // create a custom anchor tag
    const a = document.createElement('a');
    a.href = url;
    const date = this.dateFormatter.transform(backup.date, 'YYYY_MM_DD_HH_mm_ss');
    a.download = 'fledge_backup_' + date + '.tar.gz';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  public showLoadingSpinner() {
    this.showSpinner = true;
  }

  public hideLoadingSpinner() {
    this.showSpinner = false;
  }

  goToLink() {
    const urlSlug = 'backup.html'
    this.docService.goToViewQuickStartLink(urlSlug);
  }

  ngOnDestroy() {
    this.isAlive = false;
    this.viewPortSubscription.unsubscribe();
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
