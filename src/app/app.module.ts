import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { NgProgressModule } from 'ngx-progressbar';

import { AppComponent } from './app.component';
import { routing } from './app.routing';
import { AlertDialogModule } from './components/common/alert-dialog/alert-dialog.module';
import { AlertComponent } from './components/common/alert/alert.component';
import { RestartModalComponent } from './components/common/restart-modal/restart-modal.component';
import { ShutdownModalComponent } from './components/common/shut-down/shutdown-modal.component';
import { SystemAlertModule } from './components/core/system-alert/system-alert.module';
import { ServiceDiscoveryComponent } from './components/core/service-discovery/service-discovery.component';
import { SettingsComponent } from './components/core/settings';
import { FooterComponent } from './components/layout/footer';
import { LoginComponent } from './components/layout/login';
import { CertificateBaseLoginComponent } from './components/layout/certificate-base-login';
import { NavbarComponent } from './components/layout/navbar/navbar.component';
import { SideMenuComponent } from './components/layout/side-menu/side-menu.component';
import { DirectivesModule } from './directives/directives.module';
import { AuthRequiredGuard, DataViewRoleGuard } from './guards';
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
  NorthService,
  PingService,
  PackagesLogService,
  SchedulesService,
  ServicesApiService,
  SupportService,
  SystemLogService,
  UserService
} from './services';
import { HttpsRequestInterceptor } from './services/http.request.interceptor';
import { SharedService } from './services/shared.service';
import { SharedModule } from './shared.module';
import { ProgressBarComponent } from './components/common/progress-bar/progress-bar.component';
import { AdditionalServicesUtils } from './components/core/developer/additional-services/additional-services-utils.service';
import { ProgressBarService } from './services/progress-bar.service';
import { DashboardModule } from './components/core/dashboard/dashboard.module';
import { Router } from '@angular/router';
import { LogsModule } from './components/core/logs/logs.module';

export function pingServiceFactory(ping: PingService, sharedService: SharedService, router: Router): Function {
  return () => ping.pingService()
    .then((data) => {
      sessionStorage.setItem('LOGIN_SKIPPED', JSON.stringify(data['authenticationOptional']));
      sessionStorage.setItem('SERVICE_NAME', JSON.stringify(data['serviceName']));
      if (!location.href.includes('ott') && sessionStorage.getItem('token') === null && !JSON.parse(sessionStorage.getItem('LOGIN_SKIPPED'))) {
        router.navigate(['/login']);
        sharedService.loginScreenSubject.next(true);
      } else {
        if (location.href.includes('/setting?id=1')) {
          router.navigate([''])
        }
      }
    })
    .catch(error => {
      // Set isService to true, if response status code is not undefined and not 0 & not 404
      if (error && error.status && !(error.status === 0 || error.status === 404)) {
        if (!location.href.includes('ott')) {
          router.navigate(['/login'])
        }
      } else {
        if (!location.href.includes('ott')) {
          router.navigate(['/setting'], { queryParams: { id: '1' } });
        }
      }
      sharedService.loginScreenSubject.next(true);
    });
}

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    routing,
    NgProgressModule,
    PipesModule,
    AlertDialogModule,
    SharedModule,
    DashboardModule,
    DirectivesModule,
    SystemAlertModule,
    LogsModule
  ],
  declarations: [
    AppComponent,
    LoginComponent,
    CertificateBaseLoginComponent,
    AlertComponent,
    ProgressBarComponent,
    FooterComponent,
    SideMenuComponent,
    NavbarComponent,
    SettingsComponent,
    ServiceDiscoveryComponent,
    ShutdownModalComponent,
    RestartModalComponent
  ],
  providers: [
    AuthRequiredGuard,
    DataViewRoleGuard,
    {
      provide: 'ALERT_SERVICE',
      useExisting: AlertService,
    },
    AuthService,
    ConfigurationService,
    AuditService,
    SystemLogService,
    PackagesLogService,
    ServicesApiService,
    {
      provide: APP_INITIALIZER,
      useFactory: pingServiceFactory,
      deps: [PingService, SharedService, Router],
      multi: true
    },
    ConnectedServiceStatus,
    DiscoveryService,
    SharedService,
    CertificateService,
    SupportService,
    BackupRestoreService,
    PingService,
    NorthService,
    SchedulesService,
    {
      provide: 'PROGRESS_SERVICE',
      useExisting: ProgressBarService,
    },
    UserService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpsRequestInterceptor,
      multi: true,
    },
    {
      provide: 'ADDITIONAL_SERVICE',
      useExisting: AdditionalServicesUtils
    },
    {
      provide: 'SHARED_SERVICE',
      useExisting: SharedService
    }
  ],
  bootstrap: [AppComponent]
})

export class AppModule { }
