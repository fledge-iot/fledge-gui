import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
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
import { TimeDropdownComponent } from './components/common/time-dropdown/time-dropdown.component';
import { OpacitySliderComponent } from './components/common/opacity-slider/opacity-slider.component';

@NgModule({
  imports: [CommonModule, CodemirrorModule, PipesModule, FormsModule, DirectivesModule, NgSelectModule, ReactiveFormsModule],
  declarations: [ViewConfigItemComponent, ConfigChildrenComponent, PluginModalComponent, ViewLogsComponent, TimeDropdownComponent, OpacitySliderComponent],
  exports: [ViewConfigItemComponent, ConfigChildrenComponent, PluginModalComponent, ViewLogsComponent, TimeDropdownComponent, OpacitySliderComponent]
})
export class SharedModule { }
