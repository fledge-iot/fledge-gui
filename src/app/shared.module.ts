import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ViewConfigItemComponent } from './components/core/configuration-manager/view-config-item/view-config-item.component';
import { MockViewConfigItemComponent } from './components/core/configuration-manager/mock-view-config-item/mock-view-config-item.component';
import { PipesModule } from './pipes/pipes.module';
import { DirectivesModule } from './directives/directives.module';

@NgModule({
  imports: [CommonModule, PipesModule, FormsModule, DirectivesModule],
  declarations: [ViewConfigItemComponent, MockViewConfigItemComponent],
  exports: [ViewConfigItemComponent, MockViewConfigItemComponent]
})
export class SharedModule { }
