import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgProgressModule } from 'ngx-progressbar';
import { PipesModule } from '../../../pipes/pipes.module';
import { ConfigurationService } from '../../../services';
import { ConfigurationManagerComponent } from '.';
import { AddConfigItemComponent } from './add-config-item/add-config-item.component';
import { Routes, RouterModule } from '@angular/router';
import { AuthCheckGuard } from '../../../guards';

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
    PipesModule
  ],
  providers: [ConfigurationService]
})
export class ConfigurationModule { }
