import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '../../../guards';
import { SystemLogComponent } from '.';
import { NumberInputDebounceModule } from '../../common/number-input-debounce/number-input-debounce.module';
import { NgProgressModule } from 'ngx-progressbar';
import { PaginationModule } from '../../common/pagination/pagination.module';

const routes: Routes = [
  {
    path: '',
    component: SystemLogComponent,
    canActivate: [AuthGuard]
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
