import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuickviewComponent } from './quickview.component';
import { LogsModule } from '../../core/logs/logs.module';



@NgModule({
  declarations: [QuickviewComponent],
  imports: [
    CommonModule,
    LogsModule
  ],
  exports: [QuickviewComponent]
})
export class QuickviewModule { }
