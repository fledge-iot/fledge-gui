import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { UserManagementComponent } from '.';
import { DirectivesModule } from '../../../directives/directives.module';
import { AdminGuard, AuthenticatedUserGuard } from '../../../guards';
import { AlertDialogModule } from '../../common/alert-dialog/alert-dialog.module';
import { CreateUserComponent } from './create-user/create-user.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { UpdateUserComponent } from './update-user/update-user.component';
import { UserProfileComponent } from './user-profile/user-profile.component';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthenticatedUserGuard, AdminGuard],
    component: UserManagementComponent
  },
  {
    path: 'profile',
    canActivate: [AuthenticatedUserGuard],
    component: UserProfileComponent
  },
  {
    path: 'reset-password',
    canActivate: [AuthenticatedUserGuard],
    component: ResetPasswordComponent
  },
];

@NgModule({
  declarations: [
    UserManagementComponent,
    UpdateUserComponent,
    CreateUserComponent,
    UserProfileComponent,
    ResetPasswordComponent
  ],
  imports: [
    FormsModule,
    CommonModule,
    RouterModule.forChild(routes),
    AlertDialogModule,
    DirectivesModule
  ],
  providers: [AuthenticatedUserGuard, AdminGuard],
  exports: []
})
export class UserManagementModule { }
