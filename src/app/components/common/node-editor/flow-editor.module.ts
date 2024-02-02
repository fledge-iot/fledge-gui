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
import { RouterModule } from '@angular/router';
import { FilterModule } from '../../core/filter/filter.module';



@NgModule({
  declarations: [NodeEditorComponent,
    CustomNodeComponent,
    CustomSocketComponent,
    CustomConnectionComponent,
    RefDirective],
  imports: [
    CommonModule,
    QuickviewModule,
    LogsModule,
    SharedModule,
    RouterModule,
    FilterModule
  ],
  exports: [NodeEditorComponent,
    CustomNodeComponent,
    CustomSocketComponent,
    CustomConnectionComponent,
    RefDirective]
})
export class FlowEditorModule { }
