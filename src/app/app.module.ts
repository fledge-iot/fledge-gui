import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpsRequestInterceptor } from './services/http.request.interceptor';

import { AppComponent } from './app.component';
import { routing } from './app.routing';

import { AuthGuard } from './guards/index';
import {
  AlertService,
  AuthService,
  AuditService,
  ConfigurationService,
  StatisticsService,
  ServicesHealthService,
  ConnectedServiceStatus,
  DiscoveryService,
  UserService,
  CertificateService,
  SupportService,
  SystemLogService,
  BackupRestoreService,
  PingService
} from './services/index';

import { LoginComponent } from './components/layout/login/index';
import { FooterComponent } from './components/layout/footer/index';
import { DashboardComponent } from './components/core/dashboard/index';

import { ChartModule } from './components/common/chart/index';
import { SideMenuComponent } from './components/layout/side-menu/side-menu.component';
import { NavbarComponent } from './components/layout/navbar/navbar.component';
import { AuditLogComponent } from './components/core/audit-log/audit-log.component';
import { SidebarModule } from 'ng-sidebar';
import { SettingsComponent } from './components/core/settings/index';
import { ServicesHealthComponent } from './components/core/services-health/index';
import { NumberOnlyDirective } from './directives/number-only.directive';
import { InputTrimDirective } from './directives/input-trim.directive';
import { NgProgressModule } from 'ngx-progressbar';
import { ServiceDiscoveryComponent } from './components/core/service-discovery/service-discovery.component';

import { AngularMultiSelectModule } from 'angular2-multiselect-dropdown/angular2-multiselect-dropdown';
import { ShutdownModalComponent } from './components/common/shut-down/shutdown-modal.component';
import { SharedService } from './services/shared.service';

import {  } from './directives/index';
import { SupportComponent } from './components/core/support/support.component';
import { SystemLogComponent } from './components/core/system-log/system-log.component';
import { BackupRestoreComponent } from './components/core/backup-restore/backup-restore.component';
import { ResetPasswordComponent } from './components/core/user-management/reset-password/reset-password.component';

import { SchedulerModule } from './components/core/scheduler/scheduler.module';
import { AssetsModule } from './components/core/asset-readings/assets.module';
import { PipesModule } from './pipes/pipes.module';
import { ConfigurationModule } from './components/core/configuration-manager/configuration.module';
import { UserManagementModule } from './components/core/user-management/user.management.module';
import { AlertComponent } from './components/common/alert/alert.component';
import { AlertDialogModule } from './components/common/alert-dialog/alert-dialog.module';
import { EqualValidatorDirective } from './directives/equal-validator.directive';
import { UserGuard } from './guards/user.guard';
import { CertificateModule } from './components/core/certificate/certificate.module';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    routing,
    ChartModule,
    SidebarModule.forRoot(),
    NgProgressModule,
    AngularMultiSelectModule,
    SchedulerModule,
    AssetsModule,
    PipesModule,
    ConfigurationModule,
    UserManagementModule,
    AlertDialogModule,
    CertificateModule
  ],
  declarations: [
    AppComponent,
    LoginComponent,
    AlertComponent,
    FooterComponent,
    DashboardComponent,
    SideMenuComponent,
    NavbarComponent,
    AuditLogComponent,
    SettingsComponent,
    ServicesHealthComponent,
    NumberOnlyDirective,
    InputTrimDirective,
    ServiceDiscoveryComponent,
    ShutdownModalComponent,
    EqualValidatorDirective,
    SupportComponent,
    SystemLogComponent,
    BackupRestoreComponent,
    ResetPasswordComponent
  ],
  providers: [
    AuthGuard,
    UserGuard,
    AlertService,
    AuthService,
    ConfigurationService,
    StatisticsService,
    AuditService,
    SystemLogService,
    ServicesHealthService,
    ConnectedServiceStatus,
    DiscoveryService,
    SharedService,
    CertificateService,
    SupportService,
    BackupRestoreService,
    PingService,
    UserService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpsRequestInterceptor,
      multi: true,
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
