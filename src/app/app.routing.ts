import { Routes, RouterModule } from '@angular/router';

import { LoginComponent } from './components/layout/login/index';
import { DashboardComponent } from './components/core/dashboard/index';
import { ConfigurationManagerComponent } from './components/core/configuration-manager/index';
import { ScheduledProcessComponent } from './components/core/scheduler/scheduled-process/index';
import { SystemLogComponent } from './components/core/system-log/index';
import { AssetsComponent } from './components/core/asset-readings/assets/index';
import { AuditLogComponent } from './components/core/audit-log/index';
import { CertificateStoreComponent } from './components/core/certificate/certificate-store/index';
import { SupportComponent } from './components/core/support/index';
import { BackupRestoreComponent } from './components/core/backup-restore/index';
import { SettingsComponent } from './components/core/settings/index';
import { ServicesHealthComponent } from './components/core/services-health/index';
import { ServiceDiscoveryComponent } from './components/core/service-discovery/index';
import { UserManagementComponent } from './components/core/user-management/index';
import { AuthGuard } from './guards/index';
import { UserProfileComponent } from './components/core/user-management/user-profile/user-profile.component';
import { ResetPasswordComponent } from './components/core/user-management/reset-password/reset-password.component';
import { UserGuard } from './guards/user.guard';

const appRoutes: Routes = [
    { path: '', component: DashboardComponent, canActivate: [AuthGuard] },
    { path: 'login', component: LoginComponent },
    { path: 'configuration', component: ConfigurationManagerComponent, canActivate: [AuthGuard] },
    { path: 'scheduled-task', component: ScheduledProcessComponent, canActivate: [AuthGuard] },
    { path: 'syslog', component: SystemLogComponent, canActivate: [AuthGuard] },
    { path: 'asset', component: AssetsComponent, canActivate: [AuthGuard] },
    { path: 'audit', component: AuditLogComponent, canActivate: [AuthGuard] },
    { path: 'certificate', component: CertificateStoreComponent, canActivate: [AuthGuard] },
    { path: 'support', component: SupportComponent, canActivate: [AuthGuard] },
    { path: 'backup-restore', component: BackupRestoreComponent, canActivate: [AuthGuard] },
    { path: 'setting', component: SettingsComponent },
    { path: 'services-health', component: ServicesHealthComponent, canActivate: [AuthGuard] },
    { path: 'service-discovery', component: ServiceDiscoveryComponent },
    { path: 'user-management', component: UserManagementComponent, canActivate: [UserGuard] },
    { path: 'user-profile', component: UserProfileComponent, canActivate: [AuthGuard] },
    { path: 'reset-password', component: ResetPasswordComponent},
    // otherwise redirect to dashboard
    { path: '**', redirectTo: '' }
];

export const routing = RouterModule.forRoot(appRoutes, {useHash: true});
