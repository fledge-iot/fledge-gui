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
  loading: boolean = false;
  cert;
  key;
  @ViewChild('fileInput') fileInput: ElementRef;
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();

  constructor(private certificateService: CertificateService, private alertService: AlertService, public formBuilder: FormBuilder) { }

  ngOnInit() {
    this.form = this.formBuilder.group({
      key: null,
      cert: null
    });
  }
  
  public toggleModal(isOpen: Boolean) {
    console.log('openUploadCertModal');
    let certificate_modal = <HTMLDivElement>document.getElementById('upload_certificate_modal');
    if (isOpen) {
      certificate_modal.classList.add('is-active');
      return;
    }
    certificate_modal.classList.remove('is-active');
    this.form.reset({ overwrite: false});
  }

  onKeyChange(event) {
    if(event.target.files.length > 0) {
      let file = event.target.files[0];
      this.key = file
    }
  }

  onCertChange(event) {
    if(event.target.files.length > 0) {
      let file = event.target.files[0];
      this.cert = file;
    }
  }

  uploadCertificate() {
    let formData = new FormData();
    formData.append('key', this.cert, this.cert.name);
    formData.append('cert', this.key, this.key.name);
    this.loading = true;
    this.certificateService.uploadCertificate(formData).
        subscribe(
        data => {
          this.notify.emit();
          this.toggleModal(false);
          this.loading = false;
          this.alertService.success(data.result);
        },
        error => { 
          if (error.status === 0) {
              console.log('service down ', error);
          } else {
              this.alertService.error(error.statusText);
          }
        });
  }

}
