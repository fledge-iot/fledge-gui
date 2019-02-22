import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AlertDialogComponent } from './alert-dialog.component';

@NgModule({
  declarations: [
    AlertDialogComponent
  ],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule
  ],
  providers: [],
  exports: [AlertDialogComponent]
})
export class AlertDialogModule {}
