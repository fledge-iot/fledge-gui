import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './home/index';
import { LoginComponent } from './login/index';
import { DashboardComponent } from './dashboard/index';
import { ConfigurationManagerComponent } from './configuration-manager/index';
import { ScheduledProcessComponent } from './scheduler/scheduled-process/index';
import { AssetsComponent } from './asset-readings/assets/index';
import { AuditLogComponent } from './audit-log/index';
import { SettingsComponent } from './settings/index';
import { ServicesHealthComponent } from './services-health/index';

const appRoutes: Routes = [
    { path: 'home', component: HomeComponent},
    { path: 'login', component: LoginComponent },
    { path: '', component: DashboardComponent },
    { path: 'configuration', component: ConfigurationManagerComponent },
    { path: 'scheduled-task', component: ScheduledProcessComponent },
    { path: 'asset', component: AssetsComponent },
    { path: 'audit', component: AuditLogComponent },
    { path: 'setting', component: SettingsComponent },
    { path: 'services-health', component: ServicesHealthComponent },
    // otherwise redirect to home
    { path: '**', redirectTo: ''}
];

export const routing = RouterModule.forRoot(appRoutes);
