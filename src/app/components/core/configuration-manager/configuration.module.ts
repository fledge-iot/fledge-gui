import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { TreeModule } from 'angular-tree-component';
import { NgProgressModule } from 'ngx-progressbar';

import { ConfigurationManagerComponent } from '.';
import { DirectivesModule } from '../../../directives/directives.module';
import { AuthCheckGuard } from '../../../guards';
import { ConfigurationService } from '../../../services';
import { SharedModule } from '../../../shared.module';

const routes: Routes = [
  {
    path: '',
    component: ConfigurationManagerComponent,
    canActivate: [AuthCheckGuard]
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
    NgProgressModule,
    SharedModule,
    DirectivesModule,
    TreeModule
  ],
  providers: [ConfigurationService],
})
export class ConfigurationModule { }
