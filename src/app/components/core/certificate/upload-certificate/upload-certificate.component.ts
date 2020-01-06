import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild, HostListener } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { AlertService, CertificateService, ProgressBarService } from '../../../../services';

@Component({
  selector: 'app-upload-cert',
  templateUrl: './upload-certificate.component.html',
  styleUrls: ['./upload-certificate.component.css']
})
export class UploadCertificateComponent implements OnInit {
  form: FormGroup;
  key;
  cert;
  overwrite = '0';
  keyExtension = false;
  certExtension = false;

  @ViewChild('fileInput', { static: true }) fileInput: ElementRef;
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();

  constructor(private certificateService: CertificateService,
    public ngProgress: ProgressBarService,
    private alertService: AlertService,
    public formBuilder: FormBuilder) { }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    this.toggleModal(false);
  }

  ngOnInit() {
    this.form = this.formBuilder.group({
      key: null,
      cert: null,
      overwrite: '0'
    });

    // Set default value on form
    this.form.get('overwrite').setValue('0');
  }

  protected resetForm() {
    this.form.get('key').setValue('');
    this.form.get('cert').setValue('');
    this.form.get('key').markAsUntouched();
    this.form.get('cert').markAsUntouched();
    this.keyExtension = false;
    this.certExtension = false;
    this.overwrite = '0';
    this.cert = '';
    this.key = '';
    this.form.get('overwrite').setValue('0');
  }

  public toggleModal(isOpen: Boolean) {
    this.resetForm();
    this.form.get('key').enable();

    const certificate_modal = <HTMLDivElement>document.getElementById('upload_certificate_modal');
    if (isOpen) {
      certificate_modal.classList.add('is-active');
      return;
    }
    certificate_modal.classList.remove('is-active');
  }

  onKeyChange(event) {
    if (this.key) {
      this.key = '';
    }
    if (event.target.files.length !== 0) {
      const fileName = event.target.files[0].name;
      const ext = fileName.substr(fileName.lastIndexOf('.') + 1);
      if (ext === 'key' || ext === 'pem') {
        this.keyExtension = true;
      } else {
        this.keyExtension = false;
      }
      if (event.target.files.length > 0) {
        const file = event.target.files[0];
        this.key = file;
      }
    }
  }

  onCertChange(event) {
    if (this.cert) {
      this.cert = '';
    }
    if (event.target.files.length !== 0) {
      const fileName = event.target.files[0].name;
      const ext = fileName.substr(fileName.lastIndexOf('.') + 1);
      const certExtensions = ['cert', 'cer', 'crt', 'pem', 'json'];
      this.certExtension = false;
      if (certExtensions.includes(ext)) {
        this.certExtension = true;
      }
      if (event.target.files.length > 0) {
        const file = event.target.files[0];
        this.cert = file;
      }
    }
  }

  onOverwriteChange(event) {
    if (event.target.checked) {
      this.overwrite = '1';
    } else {
      this.overwrite = '0';
    }
  }

  uploadCertificate() {
    // Check if file has been uploaded or not
    if (!this.cert && !this.key) {
      this.alertService.error('Key or Certificate file is missing');
      return;
    }
    // Check if extension of uploaded Certificate and Key (if exist) is valid
    if ((this.cert && !this.certExtension) || (this.key && !this.keyExtension)) {
      this.alertService.error('Please upload files with correct format & extension');
      return;
    }
    const formData = new FormData();
    if (this.key) {
      formData.append('key', this.key, this.key.name);
    }
    if (this.cert) {
      formData.append('cert', this.cert, this.cert.name);
    }
    formData.append('overwrite', this.overwrite);
    /** request started */
    this.ngProgress.start();
    this.certificateService.uploadCertificate(formData).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          this.notify.emit();
          this.toggleModal(false);
          this.alertService.success(data['result']);
        },
        error => {
          /** request completed */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }
}
