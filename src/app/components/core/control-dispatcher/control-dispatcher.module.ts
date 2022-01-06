import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListControlDispatcherComponent } from './list-control-dispatcher/list-control-dispatcher.component';
import { RouterModule, Routes } from '@angular/router';
import { AuthCheckGuard } from '../../../guards';
import { ScriptStepsComponent } from './script-steps/script-steps.component';
import { WriteControlComponent } from './script-steps/write-control/write-control.component';
import { OperationControlComponent } from './script-steps/operation-control/operation-control.component';
import { ScriptControlComponent } from './script-steps/script-control/script-control.component';
import { ConfigControlComponent } from './script-steps/config-control/config-control.component';
import { PipesModule } from '../../../pipes/pipes.module';
import { ControlScriptsComponent } from './control-scripts/control-scripts.component';
import { DragDropModule } from '@angular/cdk/drag-drop';

const routes: Routes = [

  {
    path: '',
    component: ListControlDispatcherComponent,
  },
  {
    path: 'add',
    canActivate: [AuthCheckGuard]
  },
  {
    path: 'script/:name',
    component: ScriptStepsComponent
  }
];

@NgModule({
  declarations: [
    ListControlDispatcherComponent,
    ScriptStepsComponent,
    WriteControlComponent,
    OperationControlComponent,
    ScriptControlComponent,
    ConfigControlComponent,
    ControlScriptsComponent
  ],
  imports: [
    CommonModule,
    PipesModule,
    DragDropModule,
    RouterModule.forChild(routes),
  ]
})
export class ControlDispatcherModule { }
