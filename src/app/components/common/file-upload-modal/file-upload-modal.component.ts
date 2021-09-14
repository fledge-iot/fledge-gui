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
    this.formReset();
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
    this.onFileChange(event.target.files);
    event.target.value = "";
  }

  // Read file
  onFileChange(files: File[]) {
    if (files.length !== 0) {
      const fileName = files[0].name;
      this.fileName = fileName;
      if (files.length > 0) {
        const file = files[0];
        this.file = file;
      }
    }
  }

  // File drag
  onDragOver(event: any) {
    event.preventDefault();
  }

  // File drop success
  onDropSuccess(event) {
    event.preventDefault();
    this.onFileChange(event.dataTransfer.files);
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
          this.progress = false;
          this.ngProgress.done();
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

