import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ListPythonPackagesComponent } from './packages/list-python-packages/list-python-packages.component';
import { InstallPythonPackageComponent } from './packages/install-python-package/install-python-package.component';
import { ReactiveFormsModule } from '@angular/forms';
import { DeveloperGuard } from '../../../guards/developer.guard';
import { DirectivesModule } from '../../../directives/directives.module';

import { ListAdditionalServicesComponent } from './additional-services/list-additional-services.component';
import { AdditionalServiceModalComponent } from './additional-services/additional-service-modal/additional-service-modal.component';
import { AdditionalServicesContextMenuComponent } from './additional-services/additional-services-context-menu/additional-services-context-menu.component';
import { PerfMonComponent } from './perfmon/list/table.component'
import { SharedModule } from '../../../shared.module';

const routes: Routes = [
  {
    path: 'options/python/package',
    canActivate: [DeveloperGuard],
    component: ListPythonPackagesComponent
  },
  {
    path: 'options/python/package/add',
    canActivate: [DeveloperGuard],
    component: InstallPythonPackageComponent
  },
  {
    path: 'options/additional-services',
    canActivate: [DeveloperGuard],
    component: ListAdditionalServicesComponent
  },
  {
    path: 'options/additional-services/config',
    component: AdditionalServiceModalComponent
  },
  {
    path: 'perfmon',
    canActivate: [DeveloperGuard],
    component: PerfMonComponent
  }
];

@NgModule({
  declarations: [
    ListPythonPackagesComponent,
    InstallPythonPackageComponent,
    ListAdditionalServicesComponent,
    AdditionalServiceModalComponent,
    AdditionalServicesContextMenuComponent,
    PerfMonComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DirectivesModule,
    FormsModule,
    SharedModule,
    RouterModule.forChild(routes)
  ],
  providers: [DeveloperGuard],
  exports: []
})
export class DeveloperModule { }
