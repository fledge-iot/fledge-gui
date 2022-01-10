import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListControlDispatcherComponent } from './list-control-dispatcher/list-control-dispatcher.component';
import { RouterModule, Routes } from '@angular/router';
import { AuthCheckGuard } from '../../../guards';
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
    component: ScriptDetailsComponent
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
    DelayComponent
  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    PipesModule,
    DragDropModule,
    TreeModule,
    NgSelectModule,
    RouterModule.forChild(routes),
  ]
})
export class ControlDispatcherModule { }
