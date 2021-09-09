import { Component, HostListener, OnInit } from '@angular/core';
import { AlertService, BackupRestoreService, ProgressBarService } from '../../../services';

@Component({
  selector: 'app-file-upload-modal',
  templateUrl: './file-upload-modal.component.html',
  styleUrls: ['./file-upload-modal.component.css']
})
export class FileUploadModalComponent implements OnInit {

  fileName = '';
  file: File = null;
  progress = false;

  constructor(
    private backupRestoreService: BackupRestoreService,
    private alertService: AlertService,
    public ngProgress: ProgressBarService) { }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    this.toggleModal(false);
  }

  ngOnInit() { }

  public toggleModal(isOpen: Boolean) {
    const modalName = <HTMLDivElement>document.getElementById('fileUpload');
    if (isOpen) {
      modalName.classList.add('is-active');
      return;
    }
    modalName.classList.remove('is-active');
  }

  attachBackupFile(event: any) {
    if (event.target.files.length !== 0) {
      const fileName = event.target.files[0].name;
      this.fileName = fileName;
      if (event.target.files.length > 0) {
        const file = event.target.files[0];
        this.file = file;
      }
      event.target.value = "";
    }
  }

  uploadBackup() {
    this.progress = true;
    this.ngProgress.start();
    this.backupRestoreService.uploadBackup(this.file, this.fileName)
      .subscribe(
        (data: any) => {
          this.progress = false;
          this.ngProgress.done();
          this.alertService.success(data.message);
          this.formReset();
        },
        error => {
          this.ngProgress.done();
          this.progress = false;
          this.formReset();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        }
      );
  }

  formReset() {
    this.toggleModal(false);
    this.fileName = '';
    this.file = null;
  }
}

