import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { NgProgressModule } from 'ngx-progressbar';

import { AuthCheckGuard } from '../../../guards';
import { ServicesHealthService, AssetsService, SchedulesService } from '../../../services';
import { SharedModule } from '../../../shared.module';
import { AlertDialogModule } from '../../common/alert-dialog/alert-dialog.module';
import { AddServiceWizardComponent } from './add-service-wizard/add-service-wizard.component';
import { SouthComponent } from './south.component';
import { SouthServiceModalComponent } from './south-service-modal/south-service-modal.component';
import { PipesModule } from '../../../pipes/pipes.module';

const routes: Routes = [

  {
    path: '',
    component: SouthComponent,
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
    SouthComponent,
    AddServiceWizardComponent,
    SouthServiceModalComponent
  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    RouterModule.forChild(routes),
    NgProgressModule,
    AlertDialogModule,
    SharedModule,
    PipesModule
  ],
  providers: [ServicesHealthService, AssetsService, SchedulesService],
})
export class SouthModule { }
