import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewConfigItemComponent } from './components/core/configuration-manager/view-config-item/view-config-item.component';
import { PipesModule } from './pipes/pipes.module';

@NgModule({
  imports: [CommonModule, PipesModule],
  declarations: [ViewConfigItemComponent],
  exports: [ViewConfigItemComponent]
})
export class SharedModule { }
