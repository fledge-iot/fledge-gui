import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodeEditorComponent } from './node-editor.component';
import { CustomNodeComponent } from './custom-node/custom-node.component';
import { CustomSocketComponent } from './custom-socket/custom-socket.component';
import { CustomConnectionComponent } from './custom-connection/custom-connection.component';
import { RefDirective } from './ref.directive';
import { QuickviewModule } from '../quickview/quickview.module';
import { LogsModule } from '../../core/logs/logs.module';
import { SharedModule } from './../../../shared.module';
import { RouterModule, Routes } from '@angular/router';
import { FilterModule } from '../../core/filter/filter.module';
import { AddServiceWizardComponent } from '../../core/south/add-service-wizard/add-service-wizard.component';
import { RolesGuard } from '../../../guards/roles.gurad';
import { PluginService } from '../../../services/plugin.service';
import { AddTaskWizardComponent } from '../../core/north/add-task-wizard/add-task-wizard.component';
import { ReadingsCountComponent } from './south/asset-readings/readings-count.component';
import { DirectivesModule } from '../../../directives/directives.module';

const routes: Routes = [
  {
    path: 'editor/:from',
    component: NodeEditorComponent,
  },
  {
    path: 'editor/:from/:name/details',
    component: NodeEditorComponent
  },
  {
    path: 'editor/north/add',
    component: AddTaskWizardComponent,
    canActivate: [RolesGuard]
  },
  {
    path: 'editor/south/add',
    component: AddServiceWizardComponent,
    canActivate: [RolesGuard]
  }

]


@NgModule({
  declarations: [
    NodeEditorComponent,
    CustomNodeComponent,
    CustomSocketComponent,
    CustomConnectionComponent,
    ReadingsCountComponent,
    RefDirective],
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    QuickviewModule,
    LogsModule,
    SharedModule,
    RouterModule,
    FilterModule,
    SharedModule,
    DirectivesModule
  ],
  exports: [NodeEditorComponent,
    CustomNodeComponent,
    CustomSocketComponent,
    CustomConnectionComponent,
    RefDirective],
  providers: [RolesGuard, PluginService],
})
export class FlowEditorModule { }
