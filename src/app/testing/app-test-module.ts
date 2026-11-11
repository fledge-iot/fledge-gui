import { CommonModule, TitleCasePipe } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { EnvironmentProviders, Provider } from '@angular/core';
import { FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { TestModuleMetadata } from '@angular/core/testing';

import { DirectivesModule } from '../directives/directives.module';
import { PipesModule } from '../pipes/pipes.module';
import {
  AlertService,
  AssetsService,
  AuditService,
  AuthService,
  BackupRestoreService,
  CertificateService,
  ConfigurationService,
  ConnectedServiceStatus,
  DiscoveryService,
  FilterService,
  NorthService,
  NotificationsService,
  PackagesLogService,
  PingService,
  PluginService,
  ProgressBarService,
  SchedulesService,
  ServicesApiService,
  StatisticsService,
  SupportService,
  SystemAlertService,
  SystemLogService,
  UserService
} from '../services';
import { DateFormatterPipe } from '../pipes/date-formatter-pipe';
import { SharedService } from '../services/shared.service';

const APP_TEST_IMPORTS = [
  CommonModule,
  FormsModule,
  ReactiveFormsModule,
  NgSelectModule,
  CodemirrorModule,
  PipesModule,
  DirectivesModule
];

const APP_TEST_PROVIDERS: (Provider | EnvironmentProviders)[] = [
  provideHttpClient(),
  provideHttpClientTesting(),
  provideRouter([]),
  { provide: NgForm, useFactory: () => new NgForm([], []) },
  { provide: 'ALERT_SERVICE', useExisting: AlertService },
  { provide: 'PROGRESS_SERVICE', useExisting: ProgressBarService },
  { provide: 'SHARED_SERVICE', useExisting: SharedService },
  AlertService,
  AssetsService,
  AuditService,
  AuthService,
  BackupRestoreService,
  CertificateService,
  ConfigurationService,
  ConnectedServiceStatus,
  DiscoveryService,
  FilterService,
  NorthService,
  NotificationsService,
  PackagesLogService,
  PingService,
  PluginService,
  ProgressBarService,
  SchedulesService,
  ServicesApiService,
  SharedService,
  StatisticsService,
  SupportService,
  SystemAlertService,
  SystemLogService,
  UserService,
  DateFormatterPipe,
  TitleCasePipe
];

export function withAppTestDefaults(metadata: TestModuleMetadata): TestModuleMetadata {
  return {
    ...metadata,
    imports: [...APP_TEST_IMPORTS, ...(metadata.imports ?? [])],
    providers: [...APP_TEST_PROVIDERS, ...(metadata.providers ?? [])]
  };
}
