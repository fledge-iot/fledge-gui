import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgProgressModule } from 'ngx-progressbar';
import { PipesModule } from '../../../pipes/pipes.module';
import { ConfigurationService } from '../../../services';
import { ConfigurationManagerComponent } from '.';
import { AddConfigItemComponent } from './add-config-item/add-config-item.component';

@NgModule({
  declarations: [
    ConfigurationManagerComponent,
    AddConfigItemComponent
  ],
  imports: [
    FormsModule,
    CommonModule,
    NgProgressModule,
    PipesModule
  ],
  providers: [ConfigurationService]
})
export class ConfigurationModule { }
