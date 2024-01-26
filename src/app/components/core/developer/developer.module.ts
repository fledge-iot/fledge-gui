import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DeveloperComponent } from './developer.component';
import { ListPythonPackagesComponent } from './packages/list-python-packages/list-python-packages.component';
import { InstallPythonPackageComponent } from './packages/install-python-package/install-python-package.component';
import { ReactiveFormsModule } from '@angular/forms';
import { DeveloperGuard } from '../../../guards/developer.guard';
import { DirectivesModule } from '../../../directives/directives.module';

import { ListManageServicesComponent } from './manage-services/list-manage-services.component';
import { ManageServiceModalComponent } from './manage-services/manage-service-modal/manage-service-modal.component';
import { ManageServicesContextMenuComponent } from './manage-services/manage-services-context-menu/manage-services-context-menu.component';

import { PerfMonComponent } from './perfmon/list/table.component'

import { SharedModule } from '../../../shared.module';

const routes: Routes = [
  {
    path: 'options',
    canActivate: [DeveloperGuard],
    component: DeveloperComponent
  },
  {
    path: 'python/package/list',
    canActivate: [DeveloperGuard],
    component: ListPythonPackagesComponent
  },
  {
    path: 'python/package/add',
    canActivate: [DeveloperGuard],
    component: InstallPythonPackageComponent
  },
  {
    path: 'manage-services',
    canActivate: [DeveloperGuard],
    component: ListManageServicesComponent
  },
  {
    path: 'perfmon',
    canActivate: [DeveloperGuard],
    component: PerfMonComponent
  },
];

@NgModule({
  declarations: [
    DeveloperComponent,
    ListPythonPackagesComponent,
    InstallPythonPackageComponent,
    ListManageServicesComponent,
    ManageServiceModalComponent,
    ManageServicesContextMenuComponent,
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
  exports: [ListManageServicesComponent, ManageServiceModalComponent]
})
export class DeveloperModule { }
