import { Component, OnInit, ElementRef, ViewChild, Output, EventEmitter } from '@angular/core';
import { CertificateService, AlertService } from '../../services/index';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { NgProgress } from 'ngx-progressbar';
import { CustomValidator } from '../../directives/custom-validator';

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
  keyExtension: boolean = true;
  certExtension: boolean = true;
  checkedStatus: boolean = false

  @ViewChild('fileInput') fileInput: ElementRef;
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();

  constructor(private certificateService: CertificateService, public ngProgress: NgProgress, private alertService: AlertService, public formBuilder: FormBuilder) { }

  ngOnInit() {
    this.form = this.formBuilder.group({
      key: null,
      cert: null,
      overwrite: '0'
    });

    // Set default value on form
    this.form.get('overwrite').setValue('0');
    this.checkedStatus = false;
  }

  protected resetForm() {
    this.form.get('key').setValue('');
    this.form.get('cert').setValue('')
    this.keyExtension = true;
    this.certExtension = true;
    this.overwrite = '0';
    this.form.get('overwrite').setValue('0');
    this.checkedStatus = false
  }

  public toggleModal(isOpen: Boolean) {
    this.resetForm()
    let certificate_modal = <HTMLDivElement>document.getElementById('upload_certificate_modal');
    if (isOpen) {
      certificate_modal.classList.add('is-active');
      return;
    }
    certificate_modal.classList.remove('is-active');
  }

  onKeyChange(event) {
    if (event.target.files.length != 0) {
      var fileName = event.target.files[0].name;
      var ext = fileName.substr(fileName.lastIndexOf('.') + 1);
      if (ext == "key") {
        this.keyExtension = true;
      } else {
        this.keyExtension = false;
      }
      if (event.target.files.length > 0) {
        let file = event.target.files[0];
        this.key = file
      }
    }

  }

  onCertChange(event) {
    if (event.target.files.length != 0) {
      var fileName = event.target.files[0].name;
      var ext = fileName.substr(fileName.lastIndexOf('.') + 1);
      if (ext == "cert") {
        this.certExtension = true;
      } else {
        this.certExtension = false;
      }
      if (event.target.files.length > 0) {
        let file = event.target.files[0];
        this.cert = file;
      }
    }
  }

  onOverwriteChange(event) {
    if (event.target.checked) {
      this.overwrite = '1';
      this.checkedStatus = true;
    }
    else {
      this.overwrite = '0';
      this.checkedStatus = false;
    }
  }

  uploadCertificate() {
    if (this.cert && this.key) {
      if (this.certExtension && this.keyExtension) {
        let formData = new FormData();
        formData.append('key', this.cert, this.cert.name);
        formData.append('cert', this.key, this.key.name);
        formData.append('overwrite', this.overwrite);

        /** request started */
        this.ngProgress.start();
        this.certificateService.uploadCertificate(formData).
          subscribe(
            data => {
              /** request completed */
              this.ngProgress.done();
              this.notify.emit();
              this.toggleModal(false);
              this.alertService.success(data.result);
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
        this.alertService.error("Please upload files with correct format and extension");
      }
    } else {
      this.alertService.error('Key or Certificate file is missing');
    }
  }

}
