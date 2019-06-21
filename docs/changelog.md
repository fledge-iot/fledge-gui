## v1.6.0 [2019-05-22]

#### Added

* Red Hat Support and required RPM packaging
* 3D surface graph support for FFT spectrum
* Certificate Store allows PEM and JSON certificates
* More options for elapsed time in readings graph

#### Fixed

* Assorted UI/UX issues and Nicer Dropdown

## v1.5.2 [2019-04-08]

#### Added

* Notifications UI

#### Fixed

* Backup creation time format

## v1.5.1 [2019-03-12]

#### Added

* Advanced Configuration in North instance modal
* Added build version info on settings page

#### Fixed

* Certificate store upload issue
* Allow negative numbers to be entered in numeric fields
* HTTP Error (4xx / 5xx) response handling
* Days info in uptime

## v1.5.0 [2019-02-07]

#### Added

* Functionality to delete South service and North instance
* Functionality to export readings to csv file, for South service and Asset
* Service health status on mouse hover on the green/yellow/grey/red traffic light in the navbar
* Advanced Configuration in South service modal
* Support for `script` type configuration item
* Support for the usage of `displayName` for configuration categories and items
* Support to add Data Processing Applications (filter)
* Show `SAFE MODE` label in navbar if FogLAMP is running in safe mode

#### Changed

* Improved save functionality for configuration items to use category bulk update api
* Upgraded to Angular 7 (including compatible TypeScript / CLI versions)

#### Removed

* Empty validation check on save configuration items

#### Fixed

* Improved South service and North instance setup wizard

## v1.4.0 [2018-09-25]

#### Added

* Dedicated South and North menu options to see existing instances, with the ability to change configuration, enable or disable them and corresponding ingress / egress stats
* Ability to create a South plugin service or North plugin task instance via Wizard 
* Ping based statistics info in top navigation bar
* Log level filter option in syslog

#### Changed

* Revamped configuration page
* Latest Task list with status info moved under Logs

#### Removed

* Create / Delete schedule ability
* Services Health Page

#### Fixed

* Improved Graph with time based filters and auto refresh functionality
* Misc performance improvements and visual changes


## v1.3.0 [2018-07-09]
 
#### Added

* HTML reports for e2e tests `foglamp-gui/e2e-test-report/report.html`
* Add new service interface to load a south plugin [Basic]
* `./make_deb` script to create debian package `packages/Debian/build`

#### Changed

* Upgraded to Angular 6 (including compatible TypeScript / CLI versions)
* No login window with skip option will appear, If authentication is not mandatory
* FogLAMP instance status label will show the lock icon, If authentication is mandatory and allowPing is false, until you are logged in
* Auto-configuration of IP / host address, so you should be able to have instant access of FogLAMP instance with https://rasperrypi.local (whatever the host address is) and you shall not need to go to settings and "Set the URL & Restart"
* Removed milliseconds from Statistics History Graphs on dashboard
* Added refresh icon button on asset readings graph
* On configuration item the cancel button is hidden by default, instead of disabled and will appear on change
* Renamed `deploy.sh` and `build.sh` to `deploy` and `build` respectively
* Default limit for asset readings set to 100
* Asset readings graph will appear instantly, no click required

#### Removed

* Input mask external lib

#### Fixed

* Support bundles download when authentication is mandatory
* Refresh action for Statistics History Graphs on dashboard
* Fixed Syslog display order 
* and squashed many more including visual appearance and session related issues :]

#### Known Issues

* LogOut all active session not working for non-admin user (REST endpoint bug)


## v1.2
 
#### Features Addition

* Add configuration item support
* Enable / Disable Schedule
* Improved Services Health Page
* Auth Support
* User Management
* Support Bundles
* Backup and Restore
* Syslog (Logs) 
* Certificate Store
* Allows Statistics History Graph (selection for display)
* Added refresh icons for each component to fetch latest
* Allows test connection for instance connection
* Ping is configurable now in settings (default to every 5 seconds) 
* Added asset reading info tooltip on status tag in navbar
* Added e2e tests for default checks
* Added [deploy.sh](https://github.com/foglamp/foglamp-gui/blob/1.2.0/deploy.sh), see [Issue-73](https://github.com/foglamp/foglamp-gui/issues/73)   

#### Bug Fixes

* REST API error handling
* Running task cancellation, confirmation dialog 
* Create / Update schedule modal overlapping issue on iPhone
* and squashed many more :]

#### Known Issues

* Support bundles download via browser is not possible when authentication is mandatory (Please use curl request manually with authorization token header)


## v1.1.1

#### Bug Fixes

* Configuration Management: 
    * Category items alignment issue
    * JSON (object) display and save issue
* Updated Readme 

## v1.1

* Statistics History Graphs
* Configuration Management 
* Schedules and Tasks
* Audit Logs
* Assets and Readings data browsing with graphs
* Allow to connect any FogLAMP instance via Settings
