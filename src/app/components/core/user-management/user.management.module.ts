import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { NgProgressModule } from 'ngx-progressbar';
import { UserManagementComponent } from '.';
import { AlertDialogModule } from '../../common/alert-dialog/alert-dialog.module';
import { CreateUserComponent } from './create-user/create-user.component';
import { UpdateUserComponent } from './update-user/update-user.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { AdminGuard, AuthGuard } from '../../../guards';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { DirectivesModule } from '../../../directives/directives.module';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard, AdminGuard],
    component: UserManagementComponent
  },
  {
    path: 'profile',
    canActivate: [AuthGuard],
    component: UserProfileComponent
  },
  {
    path: 'reset-password',
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
    NgProgressModule,
    AlertDialogModule,
    DirectivesModule
  ],
  providers: [AuthGuard, AdminGuard],
  exports: []
})
export class UserManagementModule { }
