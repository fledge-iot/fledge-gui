import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgProgressModule } from 'ngx-progressbar';
import { NumberInputDebounceComponent } from '../../app/number-input-debounce/number-input-debounce.component';
import { PaginationComponent } from '../pagination/index';
import { AssetsComponent } from './assets/assets.component';
import { AssetSummaryComponent } from '../asset-readings/asset-summary/asset-summary.component';
import { ChartModalComponent } from '../asset-readings/chart-modal/chart-modal.component';
import { AssetSummaryService } from '../asset-readings/asset-summary/asset-summary-service';
import { PipesModule } from '../pipes/pipes.module';
import { ChartModule } from '../chart/index';

@NgModule({
  declarations: [
    AssetsComponent,
    AssetSummaryComponent,
    ChartModalComponent,
    NumberInputDebounceComponent,
    PaginationComponent
  ],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    NgProgressModule,
    PipesModule,
    ChartModule
  ],
  providers: [AssetSummaryService],
  exports: [NumberInputDebounceComponent, PaginationComponent]
})
export class AssetsModule {

}
