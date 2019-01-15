import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { CertificateService } from '../../../services';
import { AlertDialogModule } from '../../common/alert-dialog/alert-dialog.module';
import { CertificateStoreComponent } from './certificate-store';
import { UploadCertificateComponent } from './upload-certificate/upload-certificate.component';

@NgModule({
  declarations: [
   CertificateStoreComponent,
   UploadCertificateComponent
  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    AlertDialogModule
  ],
  providers: [CertificateService],
  exports: []
})
export class CertificateModule { }
