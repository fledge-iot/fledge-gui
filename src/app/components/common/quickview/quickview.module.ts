import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuickviewComponent } from './quickview.component';

@NgModule({
  declarations: [QuickviewComponent],
  imports: [
    CommonModule
  ],
  exports: [QuickviewComponent]
})
export class QuickviewModule { }
