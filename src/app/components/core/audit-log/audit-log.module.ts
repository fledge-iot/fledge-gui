import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgProgressModule } from 'ngx-progressbar';
import { PipesModule } from '../../../pipes/pipes.module';
import { NumberInputDebounceModule } from '../../common/number-input-debounce/number-input-debounce.module';
import { PaginationModule } from '../../common/pagination/pagination.module';
import { AssetsService } from '../../../services';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '../../../guards';
import { AuditLogComponent } from '.';

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
