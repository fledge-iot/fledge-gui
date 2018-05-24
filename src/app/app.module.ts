import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpsRequestInterceptor } from './services/http.request.interceptor';

import { AppComponent } from './app.component';
import { routing } from './app.routing';

import { AuthGuard, UserGuard } from './guards/index';
import { AlertComponent } from './directives/index';
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

import { LoginComponent } from './login/index';
import { FooterComponent } from './footer/index';
import { DashboardComponent } from './dashboard/index';

import { ChartModule } from './chart/index';
import { SideMenuComponent } from '../app/side-menu/side-menu.component';
import { NavbarComponent } from '../app/navbar/navbar.component';
import { AuditLogComponent } from '../app/audit-log/audit-log.component';
import { CertificateStoreComponent } from '../app/certificate/certificate-store/certificate-store.component';
import { UploadCertificateComponent } from './certificate/upload-certificate/upload-certificate.component';
import { SidebarModule } from 'ng-sidebar';
import { SettingsComponent } from './settings/index';
import { ServicesHealthComponent } from './services-health/index';
import { NumberOnlyDirective } from './directives/number-only.directive';
import { InputTrimDirective } from './directives/input-trim.directive';
import { NgProgressModule } from 'ngx-progressbar';
import { ServiceDiscoveryComponent } from './service-discovery/service-discovery.component';

import { AngularMultiSelectModule } from 'angular2-multiselect-dropdown/angular2-multiselect-dropdown';
import { ShutdownModalComponent } from './shut-down/shutdown-modal.component';
import { SharedService } from './services/shared.service';
// import { UserManagementComponent } from './user-management/user-management.component';
// import { CreateUserComponent } from './user-management/create-user/create-user.component';

import { EqualValidator } from './directives/index';
// import { UpdateUserComponent } from './user-management/update-user/update-user.component';
// import { UserProfileComponent } from './user-management/user-profile/user-profile.component';
import { SupportComponent } from './support/support.component';
import { SystemLogComponent } from './system-log/system-log.component';
import { BackupRestoreComponent } from './backup-restore/backup-restore.component';
import { ResetPasswordComponent } from './user-management/reset-password/reset-password.component';

import { SchedulerModule } from './scheduler/scheduler.module';
import { AssetsModule } from './asset-readings/assets.module';
import { PipesModule } from './pipes/pipes.module';
import { ConfigurationModule } from './configuration-manager/configuaration.module';
import { UserManagementModule } from './user-management/user.management.module';
import { ModalModule } from './modal/modal.module';

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
    ModalModule
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
    CertificateStoreComponent,
    UploadCertificateComponent,
    SettingsComponent,
    ServicesHealthComponent,
    NumberOnlyDirective,
    InputTrimDirective,
    ServiceDiscoveryComponent,
    ShutdownModalComponent,
    EqualValidator,
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
