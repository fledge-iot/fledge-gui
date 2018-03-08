import { Component, OnInit } from '@angular/core';
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
  
  // @Output() notify: EventEmitter<any> = new EventEmitter<any>();
  // @Output() process: EventEmitter<any> = new EventEmitter<any>();
  // @Output() type: EventEmitter<any> = new EventEmitter<any>();
  
  
  constructor(private certificateService: CertificateService, public formBuilder: FormBuilder) { }

  ngOnInit() {
    this.form = this.formBuilder.group({
      key: [CustomValidator.havingKeyExtension],
      certificate: [CustomValidator.havingCertExtension],
      overwrite: [Validators.required]
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

  public uploadCertificate() {
    
  }

}
