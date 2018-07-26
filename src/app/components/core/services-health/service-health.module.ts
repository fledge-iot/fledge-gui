import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { NgProgressModule } from 'ngx-progressbar';

import { AuthCheckGuard } from '../../../guards';
import { ServicesHealthService } from '../../../services';
import { SharedModule } from '../../../shared.module';
import { AlertDialogModule } from '../../common/alert-dialog/alert-dialog.module';
import { AddServiceWizardComponent } from './add-service-wizard/add-service-wizard.component';
import { ServicesHealthComponent } from './services-health.component';

const routes: Routes = [
  {
    path: '',
    component: ServicesHealthComponent,
    canActivate: [AuthCheckGuard]
  },
  {
    path: 'add',
    component: AddServiceWizardComponent,
    canActivate: [AuthCheckGuard]
  }
];

@NgModule({
  declarations: [
    ServicesHealthComponent,
    AddServiceWizardComponent
  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    RouterModule.forChild(routes),
    NgProgressModule,
    AlertDialogModule,
    SharedModule
  ],
  providers: [ServicesHealthService],
})
export class ServiceHealthModule { }
