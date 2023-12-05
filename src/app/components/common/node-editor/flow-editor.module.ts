import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodeEditorComponent } from './node-editor.component';
import { CustomNodeComponent } from './custom-node/custom-node.component';
import { CustomSocketComponent } from './custom-socket/custom-socket.component';
import { CustomConnectionComponent } from './custom-connection/custom-connection.component';
import { RefDirective } from './ref.directive';
import { QuickviewModule } from '../quickview/quickview.module';



@NgModule({
  declarations: [NodeEditorComponent,
    CustomNodeComponent,
    CustomSocketComponent,
    CustomConnectionComponent,
    RefDirective],
  imports: [
    CommonModule,
    QuickviewModule
  ],
  exports: [NodeEditorComponent,
    CustomNodeComponent,
    CustomSocketComponent,
    CustomConnectionComponent,
    RefDirective]
})
export class FlowEditorModule { }
