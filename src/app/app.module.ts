import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { SidebarModule } from 'ng-sidebar';
import { NgProgressModule } from '@ngx-progressbar/core';

import { AppComponent } from './app.component';
import { routing } from './app.routing';
import { AlertDialogModule } from './components/common/alert-dialog/alert-dialog.module';
import { AlertComponent } from './components/common/alert/alert.component';
import { RestartModalComponent } from './components/common/restart-modal/restart-modal.component';
import { ShutdownModalComponent } from './components/common/shut-down/shutdown-modal.component';
import { ListTasksComponent } from './components/core/logs/list-tasks/list-tasks.component';
import { ServiceDiscoveryComponent } from './components/core/service-discovery/service-discovery.component';
import { SettingsComponent } from './components/core/settings';
import { FooterComponent } from './components/layout/footer';
import { LoginComponent } from './components/layout/login';
import { CertificateBaseLoginComponent } from './components/layout/certificate-base-login';
import { NavbarComponent } from './components/layout/navbar/navbar.component';
import { SideMenuComponent } from './components/layout/side-menu/side-menu.component';
import { DirectivesModule } from './directives/directives.module';
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
  NorthService,
  PingService,
  PackagesLogService,
  SchedulesService,
  ServicesApiService,
  SupportService,
  SystemLogService,
  UserService,
} from './services';
import { HttpsRequestInterceptor } from './services/http.request.interceptor';
import { SharedService } from './services/shared.service';
import { SharedModule } from './shared.module';
import { ProgressBarComponent } from './components/common/progress-bar/progress-bar.component';
import { ProgressBarService } from './services/progress-bar.service';

export function pingServiceFactory(ping: PingService, sharedService: SharedService): Function {
  return () => ping.pingService()
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
    SidebarModule.forRoot(),
    NgProgressModule,
    PipesModule,
    AlertDialogModule,
    SharedModule,
    DirectivesModule
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
    RestartModalComponent,
    ListTasksComponent
  ],
  providers: [
    AuthCheckGuard,
    AlertService,
    AuthService,
    ConfigurationService,
    AuditService,
    SystemLogService,
    PackagesLogService,
    ServicesApiService,
    {
      provide: APP_INITIALIZER,
      useFactory: pingServiceFactory,
      deps: [PingService, SharedService],
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
    ProgressBarService,
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
