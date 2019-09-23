import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { CertificateService } from '../../../services';
import { AlertDialogModule } from '../../common/alert-dialog/alert-dialog.module';
import { CertificateStoreComponent } from './certificate-store';
import { UploadCertificateComponent } from './upload-certificate/upload-certificate.component';
import { Routes, RouterModule } from '@angular/router';
import { AuthCheckGuard } from '../../../guards';

const routes: Routes = [
  {
    path: '',
    component: CertificateStoreComponent,
    canActivate: [AuthCheckGuard]
  }
];

@NgModule({
  declarations: [
   CertificateStoreComponent,
   UploadCertificateComponent
  ],
  imports: [
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    AlertDialogModule
  ],
  providers: [CertificateService],
  exports: []
})
export class CertificateModule { }
