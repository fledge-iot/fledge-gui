import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SystemAlertComponent } from './system-alert.component';
import { RolesGuard } from '../../../guards';

const routes: Routes = [
  {
    path: '',
    component: SystemAlertComponent,
    canActivate: [RolesGuard]
  }
];

@NgModule({
  declarations: [
    SystemAlertComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ],
  providers: [RolesGuard],
  exports: []
})
export class SystemAlertModule { }
