import { Routes, RouterModule } from '@angular/router';

import { LoginComponent } from './login/index';
import { DashboardComponent } from './dashboard/index';
import { ConfigurationManagerComponent } from './configuration-manager/index';
import { ScheduledProcessComponent } from './scheduler/scheduled-process/index';
import { SystemLogComponent } from './system-log/index';
import { AssetsComponent } from './asset-readings/assets/index';
import { AuditLogComponent } from './audit-log/index';
import { CertificateStoreComponent } from './certificate/certificate-store/index';
import { SupportComponent } from './support/index';
import { BackupRestoreComponent } from './backup-restore/index';
import { SettingsComponent } from './settings/index';
import { ServicesHealthComponent } from './services-health/index';
import { ServiceDiscoveryComponent } from './service-discovery/index';
import { UserManagementComponent } from './user-management/index';
import { AuthGuard, UserGuard } from './guards/index';
import { UserProfileComponent } from './user-management/user-profile/user-profile.component';
import { ResetPasswordComponent } from './user-management/reset-password/reset-password.component';

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
