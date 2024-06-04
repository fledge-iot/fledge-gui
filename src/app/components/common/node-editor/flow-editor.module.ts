import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodeEditorComponent } from './node-editor.component';
import { CustomNodeComponent } from './custom-node/custom-node.component';
import { CustomNotificationNodeComponent } from './custom-notification-node/custom-notification-node.component';
import { CustomSocketComponent } from './custom-socket/custom-socket.component';
import { CustomConnectionComponent } from './custom-connection/custom-connection.component';
import { RefDirective } from './ref.directive';
import { QuickviewModule } from '../quickview/quickview.module';
import { LogsModule } from '../../core/logs/logs.module';
import { SharedModule } from './../../../shared.module';
import { RouterModule, Routes } from '@angular/router';
import { FilterModule } from '../../core/filter/filter.module';
import { AddServiceWizardComponent } from '../../core/south/add-service-wizard/add-service-wizard.component';
import { AddNotificationWizardComponent } from '../../core/notifications/add-notification-wizard/add-notification-wizard.component';

import { RolesGuard } from '../../../guards/roles.gurad';
import { PluginService, NotificationsService } from '../../../services';
import { AddTaskWizardComponent } from '../../core/north/add-task-wizard/add-task-wizard.component';
import { ReadingsCountComponent } from './south/asset-readings/readings-count.component';
import { DirectivesModule } from '../../../directives/directives.module';
import { AssetTrackerComponent } from './south/asset-tracker/asset-tracker.component';

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
  },
  {
    path: 'editor/notifications/add',
    component: AddNotificationWizardComponent,
    canActivate: [RolesGuard]
  }
]

@NgModule({
  declarations: [
    NodeEditorComponent,
    CustomNodeComponent,
    CustomNotificationNodeComponent,
    CustomSocketComponent,
    CustomConnectionComponent,
    ReadingsCountComponent,
    RefDirective,
    AssetTrackerComponent],
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    QuickviewModule,
    LogsModule,
    RouterModule,
    FilterModule,
    SharedModule,
    DirectivesModule
  ],
  exports: [NodeEditorComponent,
    CustomNodeComponent,
    CustomNotificationNodeComponent,
    CustomSocketComponent,
    CustomConnectionComponent,
    RefDirective],
  providers: [RolesGuard, PluginService, NotificationsService]
})
export class FlowEditorModule { }
