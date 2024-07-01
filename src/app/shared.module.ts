import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { NgSelectModule } from '@ng-select/ng-select';

import { ConfirmationDialogComponent } from './components/common/confirmation-dialog/confirmation-dialog.component';
import { RangeSliderComponent } from './components/common/range-slider/range-slider.component';
import { TimeDropdownComponent } from './components/common/time-dropdown/time-dropdown.component';
import { ConfigurationGroupComponent } from './components/core/configuration-manager/configuration-group/configuration-group.component';
import { PluginPersistDataComponent } from './components/core/configuration-manager/plugin-persist-data/plugin-persist-data.component';
import { ViewLogsComponent } from './components/core/logs/packages-log/view-logs/view-logs.component';
import { PluginModalComponent } from './components/core/plugin-modal/plugin-modal.component';
import { DirectivesModule } from './directives/directives.module';
import { PipesModule } from './pipes/pipes.module';
import { ShowConfigurationComponent } from './components/core/configuration-manager/show-configuration/show-configuration.component';
import { BucketConfigurationComponent } from './components/core/configuration-manager/bucket-configuration/bucket-configuration.component';
import { TabNavigationComponent } from './components/core/configuration-manager/tab-navigation/tab-navigation.component';
import { AddServiceWizardComponent } from './components/core/south/add-service-wizard/add-service-wizard.component';
import { AddTaskWizardComponent } from './components/core/north/add-task-wizard/add-task-wizard.component';
import { TaskScheduleComponent } from './components/core/north/task-schedule/task-schedule.component';
import { NotificationServiceWarningComponent } from './components/core/notifications/notification-service-warning/notification-service-warning.component';
import { ServiceConfigComponent } from './components/core/notifications/service-config/service-config.component';

import { ListTypeConfigurationComponent } from './components/core/configuration-manager/list-type-configuration/list-type-configuration.component';
import { KvListTypeConfigurationComponent } from './components/core/configuration-manager/kv-list-type-configuration/kv-list-type-configuration.component';

@NgModule({
  imports: [
    CommonModule,
    CodemirrorModule,
    PipesModule,
    FormsModule,
    DirectivesModule,
    NgSelectModule,
    ReactiveFormsModule
  ],
  declarations: [
    ConfigurationGroupComponent,
    BucketConfigurationComponent,
    ListTypeConfigurationComponent,
    KvListTypeConfigurationComponent,
    ShowConfigurationComponent,
    PluginPersistDataComponent,
    PluginModalComponent,
    ViewLogsComponent,
    TimeDropdownComponent,
    RangeSliderComponent,
    ConfirmationDialogComponent,
    TabNavigationComponent,
    AddServiceWizardComponent,
    AddTaskWizardComponent,
    TaskScheduleComponent,
    NotificationServiceWarningComponent,
    ServiceConfigComponent
  ],
  exports: [
    ConfigurationGroupComponent,
    ShowConfigurationComponent,
    PluginPersistDataComponent,
    PluginModalComponent,
    ViewLogsComponent,
    TimeDropdownComponent,
    RangeSliderComponent,
    ConfirmationDialogComponent,
    TabNavigationComponent,
    AddServiceWizardComponent,
    AddTaskWizardComponent,
    TaskScheduleComponent,
    NotificationServiceWarningComponent,
    ServiceConfigComponent
  ]
})
export class SharedModule { }
