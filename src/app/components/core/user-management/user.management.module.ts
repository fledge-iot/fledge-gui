import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { NgProgressModule } from 'ngx-progressbar';
import { UserManagementComponent } from '.';
import { EqualValidatorDirective } from '../../../directives/equal-validator.directive';
import { AuthGuard } from '../../../guards';
import { AlertDialogModule } from '../../common/alert-dialog/alert-dialog.module';
import { CreateUserComponent } from './create-user/create-user.component';
import { UpdateUserComponent } from './update-user/update-user.component';
import { UserProfileComponent } from './user-profile/user-profile.component';

const routes: Routes = [
  {
    path: '',
    component: UserManagementComponent
  },
  {
    path: 'profile',
    component: UserProfileComponent
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
  providers: [],
  exports: []
})
export class UserManagementModule {}
