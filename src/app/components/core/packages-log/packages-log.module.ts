import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { PackagesLogComponent } from './packages-log.component';
import { AuthCheckGuard } from '../../../guards';
import { PipesModule } from '../../../pipes/pipes.module';
import { SharedModule } from '../../../shared.module';

const routes: Routes = [
  {
    path: '',
    component: PackagesLogComponent,
    canActivate: [AuthCheckGuard]
  }
];

@NgModule({
  declarations: [
    PackagesLogComponent
  ],
  imports: [
    FormsModule,
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes),
    PipesModule
  ],
  providers: [],
  exports: []
})
export class PackagesLogModule { }
