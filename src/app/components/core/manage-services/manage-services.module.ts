import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { RolesGuard } from '../../../guards';
import { ListManageServicesComponent } from './list-manage-services.component';
import { DirectivesModule } from '../../../directives/directives.module';

const routes: Routes = [
  {
    path: 'services/list',
    canActivate: [RolesGuard],
    component: ListManageServicesComponent
  }
];

@NgModule({
  declarations: [
    ListManageServicesComponent
  ],
  imports: [
    CommonModule,
    DirectivesModule,
    RouterModule.forChild(routes)
  ],
  providers: [RolesGuard],
})
export class ManageServicesModule { }
