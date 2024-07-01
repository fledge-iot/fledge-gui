import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PipesModule } from '../../../pipes/pipes.module';
import { NumberInputDebounceModule } from '../../common/number-input-debounce/number-input-debounce.module';
import { PaginationModule } from '../../common/pagination/pagination.module';
import { SystemLogComponent } from './system-log';
import { AuditLogComponent } from './audit-log';
import { PackagesLogComponent } from './packages-log/packages-log.component';
import { NotificationLogComponent } from './notification-log/notification-log.component';
import { TasksComponent } from './tasks/tasks.component';
import { SharedModule } from '../../../shared.module';

const routes: Routes = [
  {
    path: 'syslog',
    component: SystemLogComponent
  },
  {
    path: 'audit',
    component: AuditLogComponent
  },
  {
    path: 'packages',
    component: PackagesLogComponent
  },
  {
    path: 'notifications',
    component: NotificationLogComponent
  },
  {
    path: 'tasks',
    component: TasksComponent
  }
];


@NgModule({
  declarations: [
    SystemLogComponent,
    AuditLogComponent,
    PackagesLogComponent,
    NotificationLogComponent,
    TasksComponent
  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    CommonModule,
    PipesModule,
    SharedModule,
    NumberInputDebounceModule,
    PaginationModule
  ],
  providers: [

  ],
  exports: [SystemLogComponent, NotificationLogComponent]
})
export class LogsModule { }
