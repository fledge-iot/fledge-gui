import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { BackupRestoreComponent } from './components/core/backup-restore';
import { CertificateStoreComponent } from './components/core/certificate/certificate-store';
import { DashboardComponent } from './components/core/dashboard';
import { ListTasksComponent } from './components/core/logs';
import { ServiceDiscoveryComponent } from './components/core/service-discovery';
import { SettingsComponent } from './components/core/settings';
import { SupportComponent } from './components/core/support';
import { LoginComponent } from './components/layout/login';
import { AuthCheckGuard } from './guards';

const appRoutes: Routes = [
  { path: '', component: DashboardComponent, canActivate: [AuthCheckGuard] },
  { path: 'asset', loadChildren: () => import('./components/core/asset-readings/assets.module').then(m => m.AssetsModule) },
  { path: 'south', loadChildren: () => import('./components/core/south/south.module').then(m => m.SouthModule) },
  { path: 'north', loadChildren: () => import('./components/core/north/north.module').then(m => m.NorthModule) },
  { path: 'login', component: LoginComponent },
  { path: 'configuration', loadChildren: () => import('./components/core/configuration-manager/configuration.module').then(m => m.ConfigurationModule) },
  { path: 'schedules', loadChildren: () => import('./components/core/scheduler/scheduler.module').then(m => m.SchedulerModule) },
  { path: 'syslog', loadChildren: () => import('./components/core/system-log/system-log.module').then(m => m.SystemLogModule) },
  { path: 'audit', loadChildren: () => import('./components/core/audit-log/audit-log.module').then(m => m.AuditLogModule) },
  { path: 'tasks', component: ListTasksComponent, canActivate: [AuthCheckGuard] },
  { path: 'notification', loadChildren: () => import('./components/core/notifications/notifications.module').then(m => m.NotificationsModule) },
  { path: 'certificate', component: CertificateStoreComponent, canActivate: [AuthCheckGuard] },
  { path: 'support', component: SupportComponent, canActivate: [AuthCheckGuard] },
  { path: 'backup-restore', component: BackupRestoreComponent, canActivate: [AuthCheckGuard] },
  { path: 'setting', component: SettingsComponent },
  { path: 'service-discovery', component: ServiceDiscoveryComponent },
  // user-management
  { path: 'user-management', loadChildren: () => import('./components/core/user-management/user.management.module').then(m => m.UserManagementModule) },
  // user/profile
  { path: 'user', loadChildren: () => import('./components/core/user-management/user.management.module').then(m => m.UserManagementModule) },
  // otherwise redirect to dashboard
  { path: '**', redirectTo: '' }
];

export const routing = RouterModule.forRoot(appRoutes, { useHash: true, preloadingStrategy: PreloadAllModules });
