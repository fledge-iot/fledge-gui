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
      this.form.get('key').setValue(file);
    }
  }

  onCertChange(event) {
    if(event.target.files.length > 0) {
      let file = event.target.files[0];
      this.cert = file;
      this.form.get('cert').setValue(file);
    }
  }

  uploadCertificate() {
    let formModel = new FormData();
    formModel.append('key', this.form.get('key').value);
    formModel.append('cert', this.form.get('cert').value);
    this.loading = true;

    this.certificateService.uploadCertificate(formModel).
        subscribe(
        data => {
          this.notify.emit();
          this.toggleModal(false);
          this.loading = false;
          this.alertService.success('Schedule created successfully.');
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
