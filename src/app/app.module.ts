import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { routing } from './app.routing';

import { AuthGuard } from './guards/index';
import { AlertComponent } from './directives/index';
import {
  AlertService, AuthService, AssetsService, AuditService, ConfigurationService,
  StatisticsService, ServicesHealthService, SchedulesService
} from './services/index';
import { HomeComponent } from './home/index';
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
import { NumberInputDebounceComponent } from '../app/number-input-debounce/number-input-debounce.component';

import { NgxMaskModule } from 'ngx-mask';
import { ModalComponent } from './modal/modal.component';
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
import { NgProgressModule } from 'ngx-progressbar';


@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    routing,
    ChartModule,
    NgxMaskModule,
    SidebarModule.forRoot(),
    NgProgressModule
  ],
  declarations: [
    AppComponent,
    LoginComponent,
    HomeComponent,
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
    NumberInputDebounceComponent,
    ModalComponent,
    UpdateModalComponent,
    SettingsComponent,
    ServicesHealthComponent,
    PaginationComponent,
    CreateScheduleComponent,
    ListTasksComponent,
    AssetSummaryComponent,
    ChartModalComponent,
    NumberOnlyDirective
  ],
  providers: [
    AuthGuard,
    AlertService,
    AuthService,
    ConfigurationService,
    StatisticsService,
    AssetsService,
    AuditService,
    SchedulesService,
    ServicesHealthService,
    AssetSummaryService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
