import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgProgressModule } from 'ngx-progressbar';
import { UserManagementComponent } from '.';
import { UpdateUserComponent } from './update-user/update-user.component';
import { CreateUserComponent } from './create-user/create-user.component';
import { AlertDialogModule } from '../../common/alert-dialog/alert-dialog.module';
import { Routes, RouterModule } from '@angular/router';
import { UserGuard, AuthGuard } from '../../../guards';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { EqualValidatorDirective } from '../../../directives/equal-validator.directive';

const routes: Routes = [
  {
    path: '',
    component: UserManagementComponent,
    canActivate: [UserGuard]
  },
  {
    path: 'profile',
    component: UserProfileComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  declarations: [
    UserManagementComponent,
    UpdateUserComponent,
    CreateUserComponent,
    UserProfileComponent,
    EqualValidatorDirective
  ],
  imports: [
    FormsModule,
    CommonModule,
    RouterModule.forChild(routes),
    NgProgressModule,
    AlertDialogModule
  ],
  providers: [UserGuard],
  exports: []
})
export class UserManagementModule {}
