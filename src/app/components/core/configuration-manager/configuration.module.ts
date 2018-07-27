import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { NgProgressModule } from 'ngx-progressbar';

import { ConfigurationManagerComponent } from '.';
import { AuthCheckGuard } from '../../../guards';
import { ConfigurationService } from '../../../services';
import { SharedModule } from '../../../shared.module';
import { AddCategoryChildComponent } from './add-category-child/add-category-child.component';
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
    AddConfigItemComponent,
    AddCategoryChildComponent
  ],
  imports: [
    FormsModule,
    CommonModule,
    RouterModule.forChild(routes),
    NgProgressModule,
    SharedModule
  ],
  providers: [ConfigurationService],
})
export class ConfigurationModule { }
