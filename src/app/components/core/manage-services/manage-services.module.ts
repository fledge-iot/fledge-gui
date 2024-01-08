import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { RolesGuard } from '../../../guards';
import { ListManageServicesComponent } from './list-manage-services.component';
import { DirectivesModule } from '../../../directives/directives.module';
import { AlertDialogModule } from '../../common/alert-dialog/alert-dialog.module';
import { ManageServiceModalComponent } from './manage-service-modal/manage-service-modal.component';
import { ManageServicesContextMenuComponent } from './manage-services-context-menu/manage-services-context-menu.component';
import { NotificationsService } from '../../../services';
import { SharedModule } from '../../../shared.module';

const routes: Routes = [
  {
    path: '',
    canActivate: [RolesGuard],
    component: ListManageServicesComponent
  }
];

@NgModule({
  declarations: [
    ListManageServicesComponent,
    ManageServiceModalComponent,
    ManageServicesContextMenuComponent
  ],
  imports: [
    CommonModule,
    DirectivesModule,
    FormsModule,
    AlertDialogModule,
    SharedModule,
    RouterModule.forChild(routes)
  ],
  providers: [RolesGuard, NotificationsService],
})
export class ManageServicesModule { }
