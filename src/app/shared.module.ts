import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  ViewConfigItemComponent,
} from './components/core/configuration-manager/view-config-item/view-config-item.component';
import { DirectivesModule } from './directives/directives.module';
import { PipesModule } from './pipes/pipes.module';

@NgModule({
  imports: [CommonModule, PipesModule, FormsModule, DirectivesModule],
  declarations: [ViewConfigItemComponent],
  exports: [ViewConfigItemComponent]
})
export class SharedModule { }
