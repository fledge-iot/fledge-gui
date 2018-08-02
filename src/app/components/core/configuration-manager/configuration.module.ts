import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { NgProgressModule } from 'ngx-progressbar';
import { TreeModule } from 'angular-tree-component';

import { ConfigurationManagerComponent } from '.';
import { AuthCheckGuard } from '../../../guards';
import { ConfigurationService } from '../../../services';
import { SharedModule } from '../../../shared.module';
import { AddConfigItemComponent } from './add-config-item/add-config-item.component';

const routes: Routes = [
  {
    path: '',
    component: ConfigurationManagerComponent,
    canActivate: [AuthCheckGuard]
  }
];

@NgModule({
  declarations: [
    ConfigurationManagerComponent,
    AddConfigItemComponent
  ],
  imports: [
    FormsModule,
    CommonModule,
    RouterModule.forChild(routes),
    NgProgressModule,
    SharedModule,
    TreeModule
  ],
  providers: [ConfigurationService],
})
export class ConfigurationModule { }
