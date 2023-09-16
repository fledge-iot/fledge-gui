import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { DirectivesModule } from '../../../directives/directives.module';
import { RolesGuard } from '../../../guards';
import { PipesModule } from '../../../pipes/pipes.module';
import { AssetsService, SchedulesService, ServicesApiService, FilterService, PluginService } from '../../../services';
import { SharedModule } from '../../../shared.module';
import { AlertDialogModule } from '../../common/alert-dialog/alert-dialog.module';
import { FilterModule } from '../filter/filter.module';
import { AddServiceWizardComponent } from './add-service-wizard/add-service-wizard.component';
import { SouthServiceModalComponent } from './south-service-modal/south-service-modal.component';
import { SouthComponent } from './south.component';
import { DetailsComponent } from './details/details.component';
import { FilterPipelineNodesComponent } from './filter-pipeline-nodes/filter-pipeline-nodes.component';
import { DragDropModule } from '@angular/cdk/drag-drop';

const routes: Routes = [
  {
    path: '',
    component: SouthComponent
  },
  {
    path: 'add',
    component: AddServiceWizardComponent,
    canActivate: [RolesGuard]
  },
  {
    path: 'details/:service',
    component: DetailsComponent,
    canActivate: [RolesGuard]
  },
];

@NgModule({
  declarations: [
    SouthComponent,
    AddServiceWizardComponent,
    SouthServiceModalComponent,
    DetailsComponent,
    FilterPipelineNodesComponent
  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    RouterModule.forChild(routes),
    AlertDialogModule,
    SharedModule,
    DirectivesModule,
    FilterModule,
    PipesModule,
    DragDropModule,
  ],
  providers: [RolesGuard, ServicesApiService, PluginService, AssetsService, SchedulesService, FilterService],
})
export class SouthModule { }
