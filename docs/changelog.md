## v1.9.1next [2021-xx-xx]

#### Added
* [FOGL-5534] Ability to paste into password type fields [#100](https://github.com/fledge-iot/fledge-gui/pull/100)
* [FOGL-5609] Script upload feature for South/North instances having script type configuration [#102](https://github.com/fledge-iot/fledge-gui/pull/102)
* [FOGL-5722] Prompt to accept the self-signed TLS certifcate and run ping against the configured Fledge host connection settings over HTTPS [#108](https://github.com/fledge-iot/fledge-gui/pull/108)

#### Changed
* [FOGL-5480] Allowed more extensions for Certificate files store [#101](https://github.com/fledge-iot/fledge-gui/pull/101)

#### Fixed
* [FOGL-5142] Packaging improvements, specifically for containerized environment [#105](https://github.com/fledge-iot/fledge-gui/pull/105/files)
* [FOGL-5523] Unexpected delete API call for a locally removed and re-added filter & Prompt to discard any local changes or save, while adding filter through wizard for South/North instances [#106](https://github.com/fledge-iot/fledge-gui/pull/106)
* [FOGL-5832] Ping issue & apperance of login screen, when configured host & port do not refer to a valid Fledge instance [#110](https://github.com/fledge-iot/fledge-gui/pull/110)


## v1.9.1 [2021-05-27]

#### Added
* [FOGL-5097]: Added documentation links for online help on various screens (#71, #73, #77)
* Show refresh icon next to 'add & enable now' link on Notification page (#75)
* [FOGL-5260]: Added filter to see externally added services logs (#79)

#### Changed
* [FOGL-4434]: Improvements have been made in the user management screens (#80)
* [FOGL-5403]: Removed delete option in certificate store page for non-admin user (#88)

#### Fixed
* [FOGL-5027]: Fixed update schedule issue which was due to time field (#69)
* Fixed South page to list services sorted by name (#70)
* [FOGL-5198]: Fixed nested readings data parsing issue for tabular data display & CSV download (#82)

## v1.9.0 [2021-02-17]

#### Added
* [FOGL-3921] Connected Fledge version information on navbar brand name hover & on settings page (#52)
* [FOGL-4704] Documentation help links (#39)
* [FOGL-4721] Northbound always on services support in North pages (#42)
* [FOGL-4119] Contribution statement
* [FOGL-4815] System logs severity filter option "Debug and above" added, default level set to "Info and above" (#51)

#### Changed
* [FOGL-4779] Type handling for Notification plugins (#41)
* [FOGL-4586] Package installation mechanism, using asynchronous API support (#38)

#### Fixed
* [FOGL-4420] Removed repeat field for manual and startup schedule (#29)
* [FOGL-4863] Allow to set retrigger time while adding a notification instance (#53)


#### Others
* Updated bulma css framework to 0.8.2 (#18)

## v1.8.2 [2020-11-03]

This release is to keep versions in sync with Fledge core. There are no functional/visual changes or any bug fix.

## v1.8.1 [2020-07-08]

#### Fixed
* Password view option with validation message on confirm password in South Pages

## v1.8.0 [2020-05-08]

#### Added
* Python editor with light and dark mode support for `script` & `code` types
* Option to show all accumulated audit logs for event engine in Notification Logs page
* Support to upload .cert, .cer, .crt & .pem certificate file without key file
* Support for configuration item validity expression
* Log link in alert for packages logs
* Support for mandatory attribute of config item
* Better control to Add, Enable / Disable the Notification Service
* Filtering by service and task in System logs page, and local search facility

#### Changed
* Upgraded to Angular 8 (including compatible TypeScript / CLI versions)
* Improved Notification and Audit Logs

#### Fixed 
* Fixed deletion of filter from pipeline on north instances
* Fixed memory leak issue with pages having auto refresh feature
* Fixed wrong API call to show category children for root categories
* Fixed notification service install and enabled state checks
* Fixed readings timestamp display issue on safari browser
* Fixed data persistence issue on add notification instance page
* Fixed multiple API network calls issue for notification instance creation
* Fixed issue in login with certificate
* Fixed legend state on graph refresh
* Fixed audit logs pagination issue
* Fixed broken graphs when time passes (00:00:00) midnight


## v1.7.0 [2019-08-15]

#### Added

* Allow login using certificate
* Interface to install plugins on South, North, Filters and Notification page
* Display the plugin name and version on South and North page
* Support for password configuration items
* JSON editor for config items of type json
* Support to update python script 
* New log tabs for Notification and Packages under logs section
* Link added in alert to show failure logs 

#### Changed 

* Updated asset reading page to show textual data

#### Fixed

* Fixed upload script issue for notification instances
* Fixed wrong time on graph data for the past reading
* Fixed save multiple filter configuration at once
* Fixed csv format for asset readings download
* Fixed RPM package installation conflict issue

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
* Show `SAFE MODE` label in navbar if Fledge is running in safe mode

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

* HTML reports for e2e tests `fledge-gui/e2e-test-report/report.html`
* Add new service interface to load a south plugin [Basic]
* `./make_deb` script to create debian package `packages/Debian/build`

#### Changed

* Upgraded to Angular 6 (including compatible TypeScript / CLI versions)
* No login window with skip option will appear, If authentication is not mandatory
* Fledge instance status label will show the lock icon, If authentication is mandatory and allowPing is false, until you are logged in
* Auto-configuration of IP / host address, so you should be able to have instant access of Fledge instance with https://rasperrypi.local (whatever the host address is) and you shall not need to go to settings and "Set the URL & Restart"
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
* Added [deploy.sh](https://github.com/fledge/fledge-gui/blob/1.2.0/deploy.sh), see [Issue-73](https://github.com/fledge/fledge-gui/issues/73)   

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
* Allow to connect any Fledge instance via Settings
