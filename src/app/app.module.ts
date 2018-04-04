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
  AssetsService,
  AuditService,
  ConfigurationService,
  StatisticsService,
  ServicesHealthService,
  SchedulesService,
  ConnectedServiceStatus,
  DiscoveryService,
  UserService,
  CertificateService,
  SupportService,
  SystemLogService,
  BackupRestoreService
} from './services/index';

import { LoginComponent } from './login/index';
import { FooterComponent } from './footer/index';

import { KeysPipe, FilterPipe, MomentDatePipe } from './pipes/index';
import { DashboardComponent } from './dashboard/index';
import { ConfigurationManagerComponent } from '../app/configuration-manager/index';

import { ChartModule } from './chart/index';
import { ScheduledProcessComponent } from '../app/scheduler/scheduled-process/index';
import { SideMenuComponent } from '../app/side-menu/side-menu.component';
import { NavbarComponent } from '../app/navbar/navbar.component';
import { AssetsComponent } from '../app/asset-readings/assets/assets.component';
import { AuditLogComponent } from '../app/audit-log/audit-log.component';
import { CertificateStoreComponent } from '../app/certificate/certificate-store/certificate-store.component';
import { NumberInputDebounceComponent } from '../app/number-input-debounce/number-input-debounce.component';

import { NgxMaskModule } from 'ngx-mask';
import { ModalComponent } from './modal/modal.component';
import { UploadCertificateComponent } from './certificate/upload-certificate/upload-certificate.component';
import { UpdateModalComponent } from './update-modal/update-modal.component';
import { SidebarModule } from 'ng-sidebar';
import { SettingsComponent } from './settings/index';
import { PaginationComponent } from './pagination/index';
import { ServicesHealthComponent } from './services-health/index';
import { CreateScheduleComponent } from './scheduler/create-schedule/create-schedule.component';
import { ListTasksComponent } from './scheduler/list-tasks/list-tasks.component';
import { AssetSummaryComponent } from './asset-readings/asset-summary/asset-summary.component';
import { ChartModalComponent } from './asset-readings/chart-modal/chart-modal.component';
import { AssetSummaryService } from './asset-readings/asset-summary/asset-summary-service';
import { NumberOnlyDirective } from './directives/number-only.directive';
import { InputTrimDirective } from './directives/input-trim.directive';
import { NgProgressModule } from 'ngx-progressbar';
import { ServiceDiscoveryComponent } from './service-discovery/service-discovery.component';

import { AngularMultiSelectModule } from 'angular2-multiselect-dropdown/angular2-multiselect-dropdown';
import { ShutdownModalComponent } from './shut-down/shutdown-modal.component';
import { SharedService } from './services/shared.service';
import { UserManagementComponent } from './user-management/user-management.component';
import { CreateUserComponent } from './user-management/create-user/create-user.component';

import { EqualValidator } from './directives/index';
import { UpdateUserComponent } from './user-management/update-user/update-user.component';
import { UserProfileComponent } from './user-management/user-profile/user-profile.component';
import { SupportComponent } from './support/support.component';
import { SystemLogComponent } from './system-log/system-log.component';
import { BackupRestoreComponent } from './backup-restore/backup-restore.component';
import { ResetPasswordComponent } from './user-management/reset-password/reset-password.component';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    routing,
    ChartModule,
    NgxMaskModule,
    SidebarModule.forRoot(),
    NgProgressModule,
    AngularMultiSelectModule
  ],
  declarations: [
    AppComponent,
    LoginComponent,
    AlertComponent,
    FooterComponent,
    KeysPipe,
    FilterPipe,
    MomentDatePipe,
    DashboardComponent,
    ConfigurationManagerComponent,
    ScheduledProcessComponent,
    SideMenuComponent,
    NavbarComponent,
    AssetsComponent,
    AuditLogComponent,
    CertificateStoreComponent,
    NumberInputDebounceComponent,
    ModalComponent,
    UploadCertificateComponent,
    UpdateModalComponent,
    SettingsComponent,
    ServicesHealthComponent,
    PaginationComponent,
    CreateScheduleComponent,
    ListTasksComponent,
    AssetSummaryComponent,
    ChartModalComponent,
    NumberOnlyDirective,
    InputTrimDirective,
    ServiceDiscoveryComponent,
    ShutdownModalComponent,
    UserManagementComponent,
    CreateUserComponent,
    EqualValidator,
    UpdateUserComponent,
    UserProfileComponent,
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
    AssetsService,
    AuditService,
    SystemLogService,
    SchedulesService,
    ServicesHealthService,
    AssetSummaryService,
    ConnectedServiceStatus,
    DiscoveryService,
    SharedService,
    CertificateService,
    SupportService,
    BackupRestoreService,
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
