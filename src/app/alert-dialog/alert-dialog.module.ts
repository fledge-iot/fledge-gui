import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgProgressModule } from 'ngx-progressbar';
import { AlertDialogComponent } from './alert-dialog.component';


@NgModule({
  declarations: [
    AlertDialogComponent
  ],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    NgProgressModule,
  ],
  providers: [],
  exports: [AlertDialogComponent]
})
export class AlertDialogModule {}
