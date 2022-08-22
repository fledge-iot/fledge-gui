import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DeveloperComponent } from './developer.component';
import { ListPythonPackagesComponent } from './packages/list-python-packages/list-python-packages.component';
import { AddPythonPackageComponent } from './packages/add-python-package/add-python-package.component';

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
    component: AddPythonPackageComponent
  }
];

@NgModule({
  declarations: [
    DeveloperComponent,
    ListPythonPackagesComponent,
    AddPythonPackageComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class DeveloperModule { }
