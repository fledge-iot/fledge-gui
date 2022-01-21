import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { TreeModule } from '@circlon/angular-tree-component';
import { NgSelectModule } from '@ng-select/ng-select';
import { DirectivesModule } from '../../../directives/directives.module';
import { AdminGuard, AuthGuard, AuthTypeGuard } from '../../../guards';
import { PipesModule } from '../../../pipes/pipes.module';
import { AddControlScriptComponent } from './add-control-script/add-control-script.component';
import { AddConfigureComponent } from './add-control-script/add-step/add-configure/add-configure.component';
import { AddDelayComponent } from './add-control-script/add-step/add-delay/add-delay.component';
import { AddOperationComponent } from './add-control-script/add-step/add-operation/add-operation.component';
import { AddScriptComponent } from './add-control-script/add-step/add-script/add-script.component';
import { AddStepConditionComponent } from './add-control-script/add-step/add-step-condition/add-step-condition.component';
import { AddStepValueComponent } from './add-control-script/add-step/add-step-value/add-step-value.component';
import { AddStepComponent } from './add-control-script/add-step/add-step.component';
import { AddWriteComponent } from './add-control-script/add-step/add-write/add-write.component';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';
import { ControlScriptsListComponent } from './list-control-dispatcher/control-scripts-list/control-scripts-list.component';
import { ListControlDispatcherComponent } from './list-control-dispatcher/list-control-dispatcher.component';

const routes: Routes = [

  {
    path: '',
    component: ListControlDispatcherComponent,
  },
  {
    path: 'script/add',
    component: AddControlScriptComponent,
    canActivate: [AuthTypeGuard]
  },
  {
    path: 'script/:name',
    component: AddControlScriptComponent
  }
];

@NgModule({
  declarations: [
    ListControlDispatcherComponent,
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
    ConfirmationDialogComponent
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
    RouterModule.forChild(routes)
  ],
  providers: [AuthTypeGuard]
})
export class ControlDispatcherModule { }
