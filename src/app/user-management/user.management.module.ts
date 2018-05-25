import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgProgressModule } from 'ngx-progressbar';
import { UserManagementComponent } from '.';
import { UpdateUserComponent } from './update-user/update-user.component';
import { CreateUserComponent } from './create-user/create-user.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { AlertDialogModule } from '../alert-dialog/alert-dialog.module';

@NgModule({
  declarations: [
    UserManagementComponent,
    UpdateUserComponent,
    CreateUserComponent,
    UserProfileComponent
  ],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    NgProgressModule,
    AlertDialogModule
  ],
  providers: [],
  exports: []
})
export class UserManagementModule {}
