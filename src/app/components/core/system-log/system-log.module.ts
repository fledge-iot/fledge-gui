import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SystemLogComponent } from '.';
import { AuthCheckGuard } from '../../../guards';
import { NumberInputDebounceModule } from '../../common/number-input-debounce/number-input-debounce.module';
import { PaginationModule } from '../../common/pagination/pagination.module';

const routes: Routes = [
  {
    path: '',
    component: SystemLogComponent,
    canActivate: [AuthCheckGuard]
  }
];

@NgModule({
  declarations: [
    SystemLogComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    NumberInputDebounceModule,
    PaginationModule
  ],
  providers: [],
  exports: []
})
export class SystemLogModule { }
