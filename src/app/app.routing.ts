import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { BackupRestoreComponent } from './components/core/backup-restore';
import { CertificateStoreComponent } from './components/core/certificate/certificate-store';
import { DashboardComponent } from './components/core/dashboard';
import { ServiceDiscoveryComponent } from './components/core/service-discovery';
import { ServicesHealthComponent } from './components/core/services-health';
import { SettingsComponent } from './components/core/settings';
import { SupportComponent } from './components/core/support';
import { LoginComponent } from './components/layout/login';
import { AuthCheckGuard } from './guards';
import { AddServiceWizardComponent } from './components/core/services-health/add-service-wizard/add-service-wizard.component';

const appRoutes: Routes = [
  { path: '', component: DashboardComponent, canActivate: [AuthCheckGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'configuration', loadChildren: './components/core/configuration-manager/configuration.module#ConfigurationModule' },
  { path: 'north', loadChildren: './components/core/north/north.module#NorthModule' },
  { path: 'scheduled-task', loadChildren: './components/core/scheduler/scheduler.module#SchedulerModule' },
  { path: 'syslog', loadChildren: './components/core/system-log/system-log.module#SystemLogModule' },
  { path: 'asset', loadChildren: './components/core/asset-readings/assets.module#AssetsModule' },
  { path: 'audit', loadChildren: './components/core/audit-log/audit-log.module#AuditLogModule' },
  { path: 'certificate', component: CertificateStoreComponent, canActivate: [AuthCheckGuard] },
  { path: 'support', component: SupportComponent, canActivate: [AuthCheckGuard] },
  { path: 'backup-restore', component: BackupRestoreComponent, canActivate: [AuthCheckGuard] },
  { path: 'setting', component: SettingsComponent },
  {
    path: 'services',
    loadChildren: './components/core/services-health/service-health.module#ServiceHealthModule',
    canActivate: [AuthCheckGuard]
  },
  { path: 'service-discovery', component: ServiceDiscoveryComponent },
  // user-management
  { path: 'user-management', loadChildren: './components/core/user-management/user.management.module#UserManagementModule' },
  // user/profile
  { path: 'user', loadChildren: './components/core/user-management/user.management.module#UserManagementModule' },
  // otherwise redirect to dashboard
  { path: '**', redirectTo: '' }
];

export const routing = RouterModule.forRoot(appRoutes, { useHash: true, preloadingStrategy: PreloadAllModules });
