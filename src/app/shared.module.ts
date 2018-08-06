import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ViewConfigItemComponent } from './components/core/configuration-manager/view-config-item/view-config-item.component';
import { PipesModule } from './pipes/pipes.module';

@NgModule({
  imports: [CommonModule, PipesModule, FormsModule],
  declarations: [ViewConfigItemComponent],
  exports: [ViewConfigItemComponent]
})
export class SharedModule { }
