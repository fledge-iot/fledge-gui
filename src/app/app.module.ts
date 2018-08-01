import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { SidebarModule } from 'ng-sidebar';
import { NgProgressModule } from 'ngx-progressbar';

import { AppComponent } from './app.component';
import { routing } from './app.routing';
import { AlertDialogModule } from './components/common/alert-dialog/alert-dialog.module';
import { AlertComponent } from './components/common/alert/alert.component';
import { ChartModule } from './components/common/chart';
import { ShutdownModalComponent } from './components/common/shut-down/shutdown-modal.component';
import { RestartModalComponent } from './components/common/restart-modal/restart-modal.component';
import { BackupRestoreComponent } from './components/core/backup-restore/backup-restore.component';
import { CertificateModule } from './components/core/certificate/certificate.module';
import { DashboardModule } from './components/core/dashboard/dashboard.module';
import { ServiceDiscoveryComponent } from './components/core/service-discovery/service-discovery.component';
import { SettingsComponent } from './components/core/settings';
import { SupportComponent } from './components/core/support/support.component';
import { FooterComponent } from './components/layout/footer';
import { LoginComponent } from './components/layout/login';
import { NavbarComponent } from './components/layout/navbar/navbar.component';
import { SideMenuComponent } from './components/layout/side-menu/side-menu.component';
import { InputTrimDirective } from './directives/input-trim.directive';
import { NumberOnlyDirective } from './directives/number-only.directive';
import { AuthCheckGuard } from './guards';
import { PipesModule } from './pipes/pipes.module';
import {
  AlertService,
  AuditService,
  AuthService,
  BackupRestoreService,
  CertificateService,
  ConfigurationService,
  ConnectedServiceStatus,
  DiscoveryService,
  PingService,
  SchedulesService,
  ServicesHealthService,
  SupportService,
  SystemLogService,
  UserService,
} from './services';
import { HttpsRequestInterceptor } from './services/http.request.interceptor';
import { SharedService } from './services/shared.service';
import { SharedModule } from './shared.module';

export function pingServiceFactory(healthService: ServicesHealthService, sharedService: SharedService): Function {
  return () => healthService.pingService()
    .then((data) => {
      sessionStorage.setItem('LOGIN_SKIPPED', JSON.stringify(data['authenticationOptional']));
      sharedService.isServiceUp.next(true);
    })
    .catch(error => {
      console.log('error: ', error);
      if (error.status === 403) {
        sharedService.isServiceUp.next(true);
      } else {
        sharedService.isServiceUp.next(false);
      }
    });
}

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
    PipesModule,
    AlertDialogModule,
    CertificateModule,
    DashboardModule,
    SharedModule
  ],
  declarations: [
    AppComponent,
    LoginComponent,
    AlertComponent,
    FooterComponent,
    SideMenuComponent,
    NavbarComponent,
    SettingsComponent,
    NumberOnlyDirective,
    InputTrimDirective,
    ServiceDiscoveryComponent,
    ShutdownModalComponent,
    RestartModalComponent,
    SupportComponent,
    BackupRestoreComponent
  ],
  providers: [
    AuthCheckGuard,
    AlertService,
    AuthService,
    ConfigurationService,
    AuditService,
    SystemLogService,
    ServicesHealthService,
    {
      provide: APP_INITIALIZER,
      useFactory: pingServiceFactory,
      deps: [ServicesHealthService, SharedService],
      multi: true
    },
    ConnectedServiceStatus,
    DiscoveryService,
    SharedService,
    CertificateService,
    SupportService,
    BackupRestoreService,
    PingService,
    SchedulesService,
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
