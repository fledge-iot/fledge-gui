import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { AuthCheckGuard } from '../../../guards';
import { PipesModule } from '../../../pipes/pipes.module';
import { AssetsService } from '../../../services';
import { NumberInputDebounceModule } from '../../common/number-input-debounce/number-input-debounce.module';
import { PaginationModule } from '../../common/pagination/pagination.module';
import { ReadingsGraphComponent } from '../asset-readings/readings-graph/readings-graph.component';
import { AssetsComponent } from './assets/assets.component';

import * as PlotlyJS from 'plotly.js/dist/plotly.js';
import { PlotlyModule } from 'angular-plotly.js';

PlotlyModule.plotlyjs = PlotlyJS;

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
    PipesModule,
    PlotlyModule,
    NumberInputDebounceModule,
    PaginationModule
  ],
  providers: [AssetsService],
  exports: []
})
export class AssetsModule { }
