import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectDropDownModule } from 'ngx-select-dropdown';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';

import {
  ViewConfigItemComponent,
} from './components/core/configuration-manager/view-config-item/view-config-item.component';
import {
  ViewLogsComponent,
} from './components/core/packages-log/view-logs/view-logs.component';
import { DirectivesModule } from './directives/directives.module';
import { PipesModule } from './pipes/pipes.module';
import { ConfigChildrenComponent } from './components/core/configuration-manager/config-children/config-children.component';
import { PluginModalComponent } from './components/core/plugin-modal/plugin-modal.component';

@NgModule({
  imports: [CommonModule, CodemirrorModule, PipesModule, FormsModule, DirectivesModule, SelectDropDownModule],
  declarations: [ViewConfigItemComponent, ConfigChildrenComponent, PluginModalComponent, ViewLogsComponent],
  exports: [ViewConfigItemComponent, ConfigChildrenComponent, PluginModalComponent, ViewLogsComponent]
})
export class SharedModule { }
