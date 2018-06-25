import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { BackupRestoreComponent } from './components/core/backup-restore';
import { CertificateStoreComponent } from './components/core/certificate/certificate-store';
import { DashboardComponent } from './components/core/dashboard';
import { ServiceDiscoveryComponent } from './components/core/service-discovery';
import { ServicesHealthComponent } from './components/core/services-health';
import { SettingsComponent } from './components/core/settings';
import { SupportComponent } from './components/core/support';
import { ResetPasswordComponent } from './components/core/user-management/reset-password/reset-password.component';
import { LoginComponent } from './components/layout/login';
import { AuthGuard } from './guards';

const appRoutes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'login', component: LoginComponent },
  { path: 'configuration', loadChildren: './components/core/configuration-manager/configuration.module#ConfigurationModule' },
  { path: 'scheduled-task', loadChildren: './components/core/scheduler/scheduler.module#SchedulerModule' },
  { path: 'syslog', loadChildren: './components/core/system-log/system-log.module#SystemLogModule' },
  { path: 'asset', loadChildren: './components/core/asset-readings/assets.module#AssetsModule' },
  { path: 'audit', loadChildren: './components/core/audit-log/audit-log.module#AuditLogModule' },
  { path: 'certificate', component: CertificateStoreComponent, canActivate: [AuthGuard] },
  { path: 'support', component: SupportComponent, canActivate: [AuthGuard] },
  { path: 'backup-restore', component: BackupRestoreComponent, canActivate: [AuthGuard] },
  { path: 'setting', component: SettingsComponent },
  { path: 'services-health', component: ServicesHealthComponent, canActivate: [AuthGuard] },
  { path: 'service-discovery', component: ServiceDiscoveryComponent },
  // /user-management
  { path: 'user-management', loadChildren: './components/core/user-management/user.management.module#UserManagementModule' },
  // user/profile
  { path: 'user', loadChildren: './components/core/user-management/user.management.module#UserManagementModule' },
  { path: 'reset-password', component: ResetPasswordComponent },
  // otherwise redirect to dashboard
  { path: '**', redirectTo: '' }
];

export const routing = RouterModule.forRoot(appRoutes, { useHash: true, preloadingStrategy: PreloadAllModules });
