import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DeveloperComponent } from './developer.component';
import { ListPythonPackagesComponent } from './packages/list-python-packages/list-python-packages.component';
import { InstallPythonPackageComponent } from './packages/install-python-package/install-python-package.component';
import { ReactiveFormsModule } from '@angular/forms';
import { DeveloperGuard } from '../../../guards/developer.guard';

const routes: Routes = [
  {
    path: '',
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
  }
];

@NgModule({
  declarations: [
    DeveloperComponent,
    ListPythonPackagesComponent,
    InstallPythonPackageComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes)
  ],
  providers: [DeveloperGuard],
})
export class DeveloperModule { }
