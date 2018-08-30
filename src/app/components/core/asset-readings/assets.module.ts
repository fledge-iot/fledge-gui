import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgProgressModule } from 'ngx-progressbar';
import { AssetsComponent } from './assets/assets.component';
import { ReadingsGraphComponent } from '../asset-readings/readings-graph/readings-graph.component';
import { PipesModule } from '../../../pipes/pipes.module';
import { ChartModule } from '../../common/chart/index';
import { AssetsService } from '../../../services';

import { Routes, RouterModule } from '@angular/router';
import { NumberInputDebounceModule } from '../../common/number-input-debounce/number-input-debounce.module';
import { PaginationModule } from '../../common/pagination/pagination.module';
import { AuthCheckGuard } from '../../../guards';

const routes: Routes = [
  {
    path: '',
    component: AssetsComponent,
    canActivate: [AuthCheckGuard]
  }
];

@NgModule({
  declarations: [
    AssetsComponent,
    ReadingsGraphComponent
  ],
  imports: [
    FormsModule,
    CommonModule,
    RouterModule.forChild(routes),
    NgProgressModule,
    PipesModule,
    ChartModule,
    NumberInputDebounceModule,
    PaginationModule
  ],
  providers: [AssetsService],
  exports: []
})
export class AssetsModule { }
