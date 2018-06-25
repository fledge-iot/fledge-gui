## v1.3.0 [Unreleased]
 
#### Added

* e2e Tests HTML Report
* Add new service with specified plugin
* `./make_deb` script to create debian package (in `packages/Debian/build)

#### Changed

* Renamed `deploy.sh` and `build.sh` to `deploy` and `build`
* Upgraded to Angular v6 (including compatible TypeScript / CLI versions)

#### Removed

* Input mask external lib

#### Bug Fixes

#### Known Issues


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
* Added [deploy.sh](deploy.sh) , see [Issue-73](https://github.com/foglamp/foglamp-gui/issues/73)   

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
* Schdules and Tasks
* Audit Logs
* Assets and Readings data browsing with graphs
* Allow to connect any FogLAMP instance via Settings
