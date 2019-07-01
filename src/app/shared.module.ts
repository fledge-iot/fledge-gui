import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectDropDownModule } from 'ngx-select-dropdown';

import {
  ViewConfigItemComponent,
} from './components/core/configuration-manager/view-config-item/view-config-item.component';
import { DirectivesModule } from './directives/directives.module';
import { PipesModule } from './pipes/pipes.module';
import { ConfigChildrenComponent } from './components/core/configuration-manager/config-children/config-children.component';
import { PluginModalComponent } from './components/core/plugin-modal/plugin-modal.component';

@NgModule({
  imports: [CommonModule, PipesModule, FormsModule, DirectivesModule, SelectDropDownModule],
  declarations: [ViewConfigItemComponent, ConfigChildrenComponent, PluginModalComponent],
  exports: [ViewConfigItemComponent, ConfigChildrenComponent, PluginModalComponent]
})
export class SharedModule { }
