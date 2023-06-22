import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { TreeModule } from '@circlon/angular-tree-component';

import { ConfigurationManagerComponent } from '.';
import { DirectivesModule } from '../../../directives/directives.module';
import { ConfigurationService } from '../../../services';
import { SharedModule } from '../../../shared.module';

const routes: Routes = [
  {
    path: '',
    component: ConfigurationManagerComponent
  }
];

@NgModule({
  declarations: [
    ConfigurationManagerComponent
  ],
  imports: [
    FormsModule,
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule,
    DirectivesModule,
    TreeModule
  ],
  providers: [ConfigurationService],
})
export class ConfigurationModule { }
