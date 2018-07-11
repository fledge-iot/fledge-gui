import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { SystemLogComponent } from '.';
import { NumberInputDebounceModule } from '../../common/number-input-debounce/number-input-debounce.module';
import { NgProgressModule } from 'ngx-progressbar';
import { PaginationModule } from '../../common/pagination/pagination.module';
import { AuthCheckGuard } from '../../../guards';

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
    NgProgressModule,
    PaginationModule
  ],
  providers: [],
  exports: []
})
export class SystemLogModule { }
