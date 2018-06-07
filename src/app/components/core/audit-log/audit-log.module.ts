import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { NgProgressModule } from 'ngx-progressbar';

import { AuditLogComponent } from '.';
import { AuthGuard } from '../../../guards';
import { PipesModule } from '../../../pipes/pipes.module';
import { NumberInputDebounceModule } from '../../common/number-input-debounce/number-input-debounce.module';
import { PaginationModule } from '../../common/pagination/pagination.module';

const routes: Routes = [
  {
    path: '',
    component: AuditLogComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  declarations: [
    AuditLogComponent
  ],
  imports: [
    FormsModule,
    CommonModule,
    RouterModule.forChild(routes),
    NgProgressModule,
    PipesModule,
    NumberInputDebounceModule,
    PaginationModule
  ],
  providers: [],
  exports: []
})
export class AuditLogModule { }
