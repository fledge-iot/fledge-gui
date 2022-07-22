import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { NgSelectModule } from '@ng-select/ng-select';

import { ConfirmationDialogComponent } from './components/common/confirmation-dialog/confirmation-dialog.component';
import { RangeSliderComponent } from './components/common/range-slider/range-slider.component';
import { TimeDropdownComponent } from './components/common/time-dropdown/time-dropdown.component';
import { ConfigChildrenComponent } from './components/core/configuration-manager/config-children/config-children.component';
import { PluginDevDataComponent } from './components/core/configuration-manager/plugin-dev-data/plugin-dev-data.component';
import {
  ViewConfigItemComponent
} from './components/core/configuration-manager/view-config-item/view-config-item.component';
import {
  ViewLogsComponent
} from './components/core/packages-log/view-logs/view-logs.component';
import { PluginModalComponent } from './components/core/plugin-modal/plugin-modal.component';
import { DirectivesModule } from './directives/directives.module';
import { PipesModule } from './pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    CodemirrorModule,
    PipesModule,
    FormsModule,
    DirectivesModule,
    NgSelectModule,
    ReactiveFormsModule
  ],
  declarations: [
    ViewConfigItemComponent,
    ConfigChildrenComponent,
    PluginDevDataComponent,
    PluginModalComponent,
    ViewLogsComponent,
    TimeDropdownComponent,
    RangeSliderComponent,
    ConfirmationDialogComponent
  ],
  exports: [
    ViewConfigItemComponent,
    ConfigChildrenComponent,
    PluginDevDataComponent,
    PluginModalComponent,
    ViewLogsComponent,
    TimeDropdownComponent,
    RangeSliderComponent,
    ConfirmationDialogComponent
  ]
})
export class SharedModule { }
