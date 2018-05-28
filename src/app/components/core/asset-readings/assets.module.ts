import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgProgressModule } from 'ngx-progressbar';
import { NumberInputDebounceComponent } from '../../common/number-input-debounce/number-input-debounce.component';
import { PaginationComponent } from '../../common/pagination/index';
import { AssetsComponent } from './assets/assets.component';
import { AssetSummaryComponent } from '../asset-readings/asset-summary/asset-summary.component';
import { ReadingsGraphComponent } from '../asset-readings/readings-graph/readings-graph.component';
import { AssetSummaryService } from '../asset-readings/asset-summary/asset-summary-service';
import { PipesModule } from '../../../pipes/pipes.module';
import { ChartModule } from '../../common/chart/index';
import { AssetsService } from '../../../services';

@NgModule({
  declarations: [
    AssetsComponent,
    AssetSummaryComponent,
    ReadingsGraphComponent,
    NumberInputDebounceComponent,
    PaginationComponent
  ],
  imports: [
    FormsModule,
    CommonModule,
    NgProgressModule,
    PipesModule,
    ChartModule
  ],
  providers: [AssetSummaryService, AssetsService],
  exports: [NumberInputDebounceComponent, PaginationComponent]
})
export class AssetsModule { }
