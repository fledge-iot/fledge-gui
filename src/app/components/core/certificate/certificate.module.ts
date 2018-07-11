import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgProgressModule } from 'ngx-progressbar';
import { CertificateStoreComponent } from './certificate-store';
import { UploadCertificateComponent } from './upload-certificate/upload-certificate.component';
import { CertificateService } from '../../../services';
import { AlertDialogModule } from '../../common/alert-dialog/alert-dialog.module';

@NgModule({
  declarations: [
   CertificateStoreComponent,
   UploadCertificateComponent
  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    NgProgressModule,
    AlertDialogModule
  ],
  providers: [CertificateService],
  exports: []
})
export class CertificateModule { }
