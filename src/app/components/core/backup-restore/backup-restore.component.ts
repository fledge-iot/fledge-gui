import { Component, OnDestroy, OnInit, ViewChild, EventEmitter } from '@angular/core';
import { interval, Subject, Subscription } from 'rxjs';
import { takeUntil, takeWhile } from 'rxjs/operators';
import { DateFormatterPipe } from '../../../pipes';
import { AlertService, PingService, ProgressBarService, RolesService, SharedService } from '../../../services';
import { BackupRestoreService } from '../../../services/backup-restore.service';
import { DialogService } from '../../common/confirmation-dialog/dialog.service';
import { DocService } from '../../../services/doc.service';
import { POLLING_INTERVAL } from '../../../utils';
import { FileUploadModalComponent } from '../../common/file-upload-modal/file-upload-modal.component';

@Component({
  selector: 'app-backup-restore',
  templateUrl: './backup-restore.component.html',
  styleUrls: ['./backup-restore.component.css']
})
export class BackupRestoreComponent implements OnInit, OnDestroy {
  public backupData = [];
  public isAlive: boolean; // used to unsubscribe from the IntervalObservable
  // when OnDestroy is called.

  public showSpinner = false;
  public refreshInterval = POLLING_INTERVAL;
  private viewPortSubscription: Subscription;
  viewPort: any = '';
  backup: any;

  @ViewChild(FileUploadModalComponent, { static: true }) fileUploadModal: FileUploadModalComponent;

  destroy$: Subject<boolean> = new Subject<boolean>();

  ascSort = false;

  public reenableButton = new EventEmitter<boolean>(false);

  constructor(private backupRestoreService: BackupRestoreService,
    private alertService: AlertService,
    private sharedService: SharedService,
    public ngProgress: ProgressBarService,
    private dateFormatter: DateFormatterPipe,
    private docService: DocService,
    private ping: PingService,
    private dialogService: DialogService,
    public rolesService: RolesService) {
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

  sort() {
    this.ascSort = !this.ascSort;
    this.sortBackups();
  }

  sortBackups() {
    if (this.backupData.length > 1) {
      if (this.ascSort) {
        // For ascending sort
        this.backupData = this.backupData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      } else {
        // For descending sort
        this.backupData = this.backupData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
    }
  }

  public getBackup() {
    this.backupRestoreService.get()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data) => {
          this.backupData = data['backups'];
          this.sortBackups();
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
          this.ngProgress.done();
          this.reenableButton.emit(false);
          this.closeModal('restore-backup-dialog');
          this.alertService.info(data['status']);
          this.getBackup();
        },
        error => {
          this.ngProgress.done();
          this.reenableButton.emit(false);
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
          this.reenableButton.emit(false);
          this.closeModal('delete-backup-dialog');
          this.alertService.success(data['message']);
          // Remove from local array of backups
          this.backupData = this.backupData.filter(b => b.id !== id);
          // reset sort to default
          if (this.backupData.length === 1) {
            this.ascSort = false;
          }
        },
        error => {
          this.ngProgress.done();
          this.reenableButton.emit(false);
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
    try {
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
    } catch (error) {
      if (error.status === 0) {
        console.log('service down ', error);
      } else {
        this.alertService.error(error.statusText);
      }
    }
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

  openModal(id: string, backup) {
    this.dialogService.open(id);
    this.backup = backup;
  }

  closeModal(id: string) {
    this.dialogService.close(id);
  }

  ngOnDestroy() {
    this.isAlive = false;
    this.viewPortSubscription.unsubscribe();
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
