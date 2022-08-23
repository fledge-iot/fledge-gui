import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DeveloperComponent } from './developer.component';
import { ListPythonPackagesComponent } from './packages/list-python-packages/list-python-packages.component';
import { InstallPythonPackageComponent } from './packages/install-python-package/install-python-package.component';

const routes: Routes = [
  {
    path: '',
    component: DeveloperComponent
  },
  {
    path: 'python/package/list',
    component: ListPythonPackagesComponent
  },
  {
    path: 'python/package/add',
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
    RouterModule.forChild(routes)
  ]
})
export class DeveloperModule { }
