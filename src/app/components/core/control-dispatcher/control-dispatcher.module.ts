import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { TreeModule } from '@ali-hm/angular-tree-component';
import { NgSelectModule } from '@ng-select/ng-select';
import { DirectivesModule } from '../../../directives/directives.module';
import { RolesGuard } from '../../../guards';
import { PipesModule } from '../../../pipes/pipes.module';
import { SharedModule } from '../../../shared.module';
import { AddControlAclComponent } from './add-control-acl/add-control-acl.component';
import { AddControlScriptComponent } from './add-control-script/add-control-script.component';
import { AddConfigureComponent } from './add-control-script/add-step/add-configure/add-configure.component';
import { AddDelayComponent } from './add-control-script/add-step/add-delay/add-delay.component';
import { AddOperationComponent } from './add-control-script/add-step/add-operation/add-operation.component';
import { AddScriptComponent } from './add-control-script/add-step/add-script/add-script.component';
import { AddStepConditionComponent } from './add-control-script/add-step/add-step-condition/add-step-condition.component';
import { AddStepValueComponent } from './add-control-script/add-step/add-step-value/add-step-value.component';
import { AddStepComponent } from './add-control-script/add-step/add-step.component';
import { AddWriteComponent } from './add-control-script/add-step/add-write/add-write.component';
import { ControlScheduleTaskDetailsComponent } from './control-schedule-task/control-schedule-task-details.component';
import { AclListComponent } from './list-control-dispatcher/acl-list/acl-list.component';
import { ControlScriptsListComponent } from './list-control-dispatcher/control-scripts-list/control-scripts-list.component';
import { ControlTasksListComponent } from './list-control-dispatcher/control-tasks-list/control-tasks-list.component';
import { ControlPipelinesComponent } from './pipelines/control-pipelines.component';
import { AddControlPipelineComponent } from './pipelines/add-pipeline/add-control-pipeline.component';
import { AddPipelineFilterComponent } from './pipelines/add-pipeline-filter/add-pipeline-filter.component';
import { ControlPipelinesService, NotificationsService, AssetsService, FilterService } from '../../../services';
import { AlertDialogModule } from '../../common/alert-dialog/alert-dialog.module';
import { FilterModule } from '../filter/filter.module';
import { APIFlowComponent } from './api-flow/api-flow.component';
import { AddEditAPIFlowComponent } from './api-flow/add-edit-api-flow/add-edit-api-flow.component';
import { DeveloperModule } from './../developer/developer.module';
import { canDeactivateGuard } from '../../../guards/can-deactivate/can-deactivate.guard';

const routes: Routes = [

  {
    path: 'script',
    component: ControlScriptsListComponent,
  },
  {
    path: 'script/add',
    component: AddControlScriptComponent,
    canActivate: [RolesGuard]
  },
  {
    path: 'script/:name/details',
    component: AddControlScriptComponent
  },
  {
    path: 'acl',
    component: AclListComponent,
  },
  {
    path: 'acl/add',
    component: AddControlAclComponent,
    canActivate: [RolesGuard]
  },
  {
    path: 'acl/:name/details',
    component: AddControlAclComponent
  },
  {
    path: 'task/add',
    component: ControlScheduleTaskDetailsComponent,
    canActivate: [RolesGuard]
  },
  {
    path: 'task/:name', // TODO: Handle FOGL-8156 when this component is enabled
    component: ControlScheduleTaskDetailsComponent
  },
  {
    path: 'pipelines',
    component: ControlPipelinesComponent
  },
  {
    path: 'pipelines/add',
    component: AddControlPipelineComponent,
    canActivate: [RolesGuard],
    canDeactivate: [canDeactivateGuard]
  },
  {
    path: 'pipelines/:id',
    component: AddControlPipelineComponent,
    canDeactivate: [canDeactivateGuard]
  },
  {
    path: 'entry-points',
    component: APIFlowComponent
  },
  {
    path: 'entry-points/add',
    component: AddEditAPIFlowComponent,
    canActivate: [RolesGuard]
  },
  {
    path: 'entry-points/:name/details',
    component: AddEditAPIFlowComponent
  }
];

@NgModule({
  declarations: [
    ControlScriptsListComponent,
    AddControlScriptComponent,
    AddStepComponent,
    AddWriteComponent,
    AddStepConditionComponent,
    AddStepValueComponent,
    AddOperationComponent,
    AddScriptComponent,
    AddConfigureComponent,
    AddDelayComponent,
    AclListComponent,
    AddControlAclComponent,
    ControlTasksListComponent,
    ControlScheduleTaskDetailsComponent,
    ControlPipelinesComponent,
    AddControlPipelineComponent,
    AddPipelineFilterComponent,
    APIFlowComponent,
    AddEditAPIFlowComponent
  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    PipesModule,
    DragDropModule,
    TreeModule,
    NgSelectModule,
    DirectivesModule,
    SharedModule,
    AlertDialogModule,
    FilterModule,
    DeveloperModule,
    RouterModule.forChild(routes)
  ],
  providers: [RolesGuard, ControlPipelinesService, NotificationsService,
    FilterService, AssetsService, TitleCasePipe]
})
export class ControlDispatcherModule { }
