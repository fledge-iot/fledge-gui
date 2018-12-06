import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  ViewConfigItemComponent,
} from './components/core/configuration-manager/view-config-item/view-config-item.component';
import { DirectivesModule } from './directives/directives.module';
import { PipesModule } from './pipes/pipes.module';
import { ConfigChildrenComponent } from './components/core/configuration-manager/config-children/config-children.component';
import { ViewFilterConfigComponent } from './components/core/filter/view-filter-config/view-filter-config.component';

@NgModule({
  imports: [CommonModule, PipesModule, FormsModule, DirectivesModule],
  declarations: [ViewConfigItemComponent, ConfigChildrenComponent, ViewFilterConfigComponent],
  exports: [ViewConfigItemComponent, ConfigChildrenComponent, ViewFilterConfigComponent]
})
export class SharedModule { }
