import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListControlDispatcherComponent } from './list-control-dispatcher/list-control-dispatcher.component';
import { RouterModule, Routes } from '@angular/router';
import { ScriptDetailsComponent } from './script-details/script-details.component';
import { WriteComponent } from './script-steps/write/write.component';
import { OperationComponent } from './script-steps/operation/operation.component';
import { ScriptComponent } from './script-steps/script/script.component';
import { ConfigComponent } from './script-steps/config/config.component';
import { PipesModule } from '../../../pipes/pipes.module';
import { ControlScriptsListComponent } from './list-control-dispatcher/control-scripts-list/control-scripts-list.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TreeModule } from '@circlon/angular-tree-component';
import { NgSelectModule } from '@ng-select/ng-select';
import { DelayComponent } from './script-steps/delay/delay.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AddControlScriptComponent } from './add-control-script/add-control-script.component';
import { AddStepComponent } from './add-control-script/add-step/add-step.component';
import { AddWriteComponent } from './add-control-script/add-step/add-write/add-write.component';
import { AddStepConditionComponent } from './add-control-script/add-step/add-step-condition/add-step-condition.component';
import { AddStepValueComponent } from './add-control-script/add-step/add-step-value/add-step-value.component';
import { AddOperationComponent } from './add-control-script/add-step/add-operation/add-operation.component';
import { AddScriptComponent } from './add-control-script/add-step/add-script/add-script.component';
import { AddConfigureComponent } from './add-control-script/add-step/add-configure/add-configure.component';
import { AddDelayComponent } from './add-control-script/add-step/add-delay/add-delay.component';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';
import { DirectivesModule } from '../../../directives/directives.module';
import { AdminGuard, AuthGuard } from '../../../guards';

const routes: Routes = [

  {
    path: '',
    component: ListControlDispatcherComponent,
  },
  {
    path: 'script/add',
    component: AddControlScriptComponent,
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'script/:name',
    // component: ScriptDetailsComponent
    component: AddControlScriptComponent
  }
];

@NgModule({
  declarations: [
    ListControlDispatcherComponent,
    ScriptDetailsComponent,
    WriteComponent,
    OperationComponent,
    ScriptComponent,
    ConfigComponent,
    ControlScriptsListComponent,
    DelayComponent,
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
  providers: [AuthGuard, AdminGuard]
})
export class ControlDispatcherModule { }
