import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgProgressModule } from 'ngx-progressbar';
import { AssetsComponent } from './assets/assets.component';
import { AssetSummaryComponent } from '../asset-readings/asset-summary/asset-summary.component';
import { ReadingsGraphComponent } from '../asset-readings/readings-graph/readings-graph.component';
import { AssetSummaryService } from '../asset-readings/asset-summary/asset-summary-service';
import { PipesModule } from '../../../pipes/pipes.module';
import { ChartModule } from '../../common/chart/index';
import { AssetsService } from '../../../services';

import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '../../../guards';
import { NumberInputDebounceModule } from '../../common/number-input-debounce/number-input-debounce.module';
import { PaginationModule } from '../../common/pagination/pagination.module';

const routes: Routes = [
  {
    path: '',
    component: AssetsComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  declarations: [
    AssetsComponent,
    AssetSummaryComponent,
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
  providers: [AssetSummaryService, AssetsService],
  exports: []
})
export class AssetsModule { }
