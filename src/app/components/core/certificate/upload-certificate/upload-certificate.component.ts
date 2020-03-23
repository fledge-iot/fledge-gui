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
  certOnly = '0';
  keyExtension = true;
  certExtension = true;

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
      overwrite: '0',
      certonly: '0'
    });

    // Set default value on form
    this.form.get('overwrite').setValue('0');
    this.form.get('certonly').setValue('0');
  }

  protected resetForm() {
    this.form.get('key').setValue('');
    this.form.get('cert').setValue('');
    this.keyExtension = true;
    this.certExtension = true;
    this.overwrite = '0';
    this.certOnly = '0';
    this.cert = '';
    this.key = '';
    this.form.get('overwrite').setValue('0');
    this.form.get('certonly').setValue('0');
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
      if (ext === 'cert' || ext === 'pem' || ext === 'json') {
        this.certExtension = true;
      } else {
        this.certExtension = false;
      }
      if (event.target.files.length > 0) {
        const file = event.target.files[0];
        this.cert = file;
      }
    }
  }

  onCertOnlyChange(event) {
    if (event.target.checked) {
      this.certOnly = '1';
      // disable the key browse option
      this.form.get('key').disable();
      this.key = '';
      this.form.get('key').setValue('');
      this.keyExtension = true;
    } else {
      this.certOnly = '0';
      this.form.get('key').enable();
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
    if (this.certOnly === '1' && !this.cert) {
      this.alertService.error('Certificate is missing');
      return;
    }
    if (this.certOnly === '0' && (!this.cert || !this.key)) {
      this.alertService.error('Key or Certificate file is missing');
      return;
    }
    if (this.certExtension && this.keyExtension) {
      const formData = new FormData();
      formData.append('cert', this.cert, this.cert.name);
      if (this.certOnly === '0') {
        formData.append('key', this.key, this.key.name);
      }
      const ext = this.cert.name.substr(this.cert.name.lastIndexOf('.') + 1);
      if (this.certOnly === '1' && ext === 'cert') {
        this.alertService.error('Accepted file extensions are .pem or .json');
        return;
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
    } else {
      this.alertService.error('Please upload files with correct format and extension');
    }
  }
}
