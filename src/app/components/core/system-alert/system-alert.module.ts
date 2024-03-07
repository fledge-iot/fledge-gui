import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SystemAlertComponent } from './system-alert.component';
import { SystemAlertService } from '../../../services';

@NgModule({
  declarations: [
    SystemAlertComponent
  ],
  imports: [
    CommonModule
  ],
  providers: [SystemAlertService],
  exports: [SystemAlertComponent]
})
export class SystemAlertModule { }
