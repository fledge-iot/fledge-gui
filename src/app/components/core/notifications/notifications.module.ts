import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { DirectivesModule } from '../../../directives/directives.module';
import { AuthCheckGuard } from '../../../guards';
import { PipesModule } from '../../../pipes/pipes.module';
import { SharedModule } from '../../../shared.module';
import { AlertDialogModule } from '../../common/alert-dialog/alert-dialog.module';
import { FilterModule } from '../filter/filter.module';
import { NotificationsComponent } from './notifications.component';
import { ServicesHealthService, NotificationsService } from '../../../services';
import { AddNotificationWizardComponent } from './add-notification-wizard/add-notification-wizard.component';
import { NotificationModalComponent } from './notification-modal/notification-modal.component';
import { ServiceResolver } from '../../../resolver/service.resolver';

const routes: Routes = [
  {
    path: '',
    component: NotificationsComponent,
    canActivate: [AuthCheckGuard],
    resolve: { service: ServiceResolver }
  },
  {
    path: 'add',
    component: AddNotificationWizardComponent,
    canActivate: [AuthCheckGuard]
  }
];

@NgModule({
  declarations: [
    NotificationsComponent,
    AddNotificationWizardComponent,
    NotificationModalComponent
  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    RouterModule.forChild(routes),
    AlertDialogModule,
    PipesModule,
    DirectivesModule,
    FilterModule,
    SharedModule
  ],
  providers: [ServicesHealthService, NotificationsService],
})
export class NotificationsModule { }
