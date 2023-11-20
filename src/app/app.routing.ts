import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { ServiceDiscoveryComponent } from './components/core/service-discovery';
import { SettingsComponent } from './components/core/settings';
import { LoginComponent } from './components/layout/login';
import { AuthRequiredGuard, DataViewRoleGuard } from './guards';
import { DashboardComponent } from './components/core/dashboard';

export const appRoutes: Routes = [
  { path: '', component: DashboardComponent, canActivate: [AuthRequiredGuard] },
  {
    path: 'asset', canActivate: [AuthRequiredGuard], loadChildren: () => import('./components/core/asset-readings/assets.module')
      .then(m => m.AssetsModule)
  },
  {
    path: 'south',
    canActivate: [AuthRequiredGuard, DataViewRoleGuard],
    loadChildren: () => import('./components/core/south/south.module')
      .then(m => m.SouthModule)
  },
  {
    path: 'north',
    canActivate: [AuthRequiredGuard, DataViewRoleGuard],
    loadChildren: () => import('./components/core/north/north.module')
      .then(m => m.NorthModule)
  },
  { path: 'login', component: LoginComponent },
  {
    path: 'configuration',
    canActivate: [AuthRequiredGuard, DataViewRoleGuard],
    loadChildren: () => import('./components/core/configuration-manager/configuration.module')
      .then(m => m.ConfigurationModule)
  },
  {
    path: 'schedules',
    canActivate: [AuthRequiredGuard, DataViewRoleGuard],
    loadChildren: () => import('./components/core/scheduler/scheduler.module')
      .then(m => m.SchedulerModule)
  },
  {
    path: 'logs',
    canActivate: [AuthRequiredGuard, DataViewRoleGuard],
    loadChildren: () => import('./components/core/logs/logs.module')
      .then(m => m.LogsModule)
  },
  {
    path: 'notification',
    canActivate: [AuthRequiredGuard, DataViewRoleGuard],
    loadChildren: () => import('./components/core/notifications/notifications.module')
      .then(m => m.NotificationsModule)
  },
  {
    path: 'control-dispatcher',
    canActivate: [AuthRequiredGuard, DataViewRoleGuard],
    loadChildren: () => import('./components/core/control-dispatcher/control-dispatcher.module')
      .then(m => m.ControlDispatcherModule)
  },
  {
    path: 'certificate',
    canActivate: [AuthRequiredGuard, DataViewRoleGuard],
    loadChildren: () => import('./components/core/certificate/certificate.module')
      .then(m => m.CertificateModule)
  },
  {
    path: 'support',
    canActivate: [AuthRequiredGuard, DataViewRoleGuard],
    loadChildren: () => import('./components/core/support/support.module')
      .then(m => m.SupportModule)
  },
  {
    path: 'backup-restore',
    canActivate: [AuthRequiredGuard],
    loadChildren: () => import('./components/core/backup-restore/backup-restore.module')
      .then(m => m.BackupRestoreModule)
  },
  {
    path: 'developer',
    canActivate: [AuthRequiredGuard, DataViewRoleGuard],
    loadChildren: () => import('./components/core/developer/developer.module')
      .then(m => m.DeveloperModule)
  },
  { path: 'setting', component: SettingsComponent },
  {
    path: 'manage-services',
    canActivate: [AuthRequiredGuard, DataViewRoleGuard],
    loadChildren: () => import('./components/core/manage-services/manage-services.module')
      .then(m => m.ManageServicesModule)
  },
  { path: 'service-discovery', component: ServiceDiscoveryComponent },
  // user-management
  {
    path: 'user-management',
    loadChildren: () => import('./components/core/user-management/user.management.module')
      .then(m => m.UserManagementModule)
  },
  // user/profile
  {
    path: 'user',
    loadChildren: () => import('./components/core/user-management/user.management.module')
      .then(m => m.UserManagementModule)
  },
  { path: '**', redirectTo: '' }
];

export const routing = RouterModule.forRoot(appRoutes, { useHash: true, preloadingStrategy: PreloadAllModules, relativeLinkResolution: 'legacy' });
