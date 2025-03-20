## v3.0.0 [2025-03-13]

### Added

- [FOGL-9300]: The ability to import list content from CSV and JSON files has been added for all configuration items that have object type list or kvlist. [#484](https://github.com/fledge-iot/fledge-gui/pull/484)
- [FOGL-9270]: A separate tabular view added to see all properties of object type list or kvlist in a single glance. [#492](https://github.com/fledge-iot/fledge-gui/pull/492)
- [FOGL-9408]: A confirmation dialog has been added to disable the flow for services to prevent accidental disabling of the services [#493](https://github.com/fledge-iot/fledge-gui/pull/493)

### Changed

- [FOGL-9472]: The appearance of the add filter user interface in the flow based editor has been improved [#486](https://github.com/fledge-iot/fledge-gui/pull/486)
- [FOGL-9508]: The look and feel of the south and north menu items has been improved with more intuitive icons [#491](https://github.com/fledge-iot/fledge-gui/pull/491)
- [FOGL-9512]: The default user interface for new installations has been changed to be the flow based editor rather than the tabular view of data pipelines. The user can still chooses either view via the Settings menu option [#495](https://github.com/fledge-iot/fledge-gui/pull/495)
- [FOGL-8975]: The configuration tab has been improved to include navigation buttons to easily move between tabs [#468](https://github.com/fledge-iot/fledge-gui/pull/468)
- [FOGL-9480]: The layout of the south service in the tabular view has been improved [#494](https://github.com/fledge-iot/fledge-gui/pull/494)
- [FOGL-9492]: Performance improvements have been made to the plugin configuration user interface within the flow editor [#498](https://github.com/fledge-iot/fledge-gui/pull/498)

## v2.6.0 [2024-10-24]

### Added

- [FOGL-8841]: Manage Configuration items access for users, per optionally available role based permissions list [#437](https://github.com/fledge-iot/fledge-gui/pull/437)

### Changed

- [FOGL-8942]: Configuration items group tabs are sorted by the minimum order of config item in the group [#471](https://github.com/fledge-iot/fledge-gui/pull/471)
- [FOGL-8458]: Developer page access through developer sub-menu options [#456](https://github.com/fledge-iot/fledge-gui/pull/456)
- [FOGL-8990]: Enhanced support for list/kvlist type configuration item [#462](https://github.com/fledge-iot/fledge-gui/pull/462)
  - Add & Delete
  - Expand/Collapse individual item
  - Expand All/Collapse All

### Fixed

- [FOGL-8588]: Filter plugin installation issue where plugin name and package name had a mismatch [#467](https://github.com/fledge-iot/fledge-gui/pull/467)
- [FOGL-9080]: Missing child categories issue in category dropdown on add control script page [#460](https://github.com/fledge-iot/fledge-gui/pull/460)
- [FOGL-9083]: Control API entry point access issue for less privileged user [#458](https://github.com/fledge-iot/fledge-gui/pull/458)
- [FOGL-9068]: Allow retrigger time of 0 for notification [#455](https://github.com/fledge-iot/fledge-gui/pull/455)
- [FOGL-8803]: Deletion of persisted data in Developer mode [#442](https://github.com/fledge-iot/fledge-gui/pull/442)
- [FOGL-8891]: Log out active session issue on user profile page [#441](https://github.com/fledge-iot/fledge-gui/pull/441)

### Others

- Visual programming based Flow Editor interface improvements
  - Delete option on connection line between nodes
  - Undo/Redo functionality
  - Filter drag & drop on connection line directly
- UI/UX improvement and various functional bug fixes

## v2.5.0 [2024-06-26]

### Added

- [FOGL-8862]: The ability to create and manage backups has become a privileged operation. Likewise support bundles can only be created by administrators. [#429](https://github.com/fledge-iot/fledge-gui/pull/429)
- [FOGL-8757]: The user management screen now shows if a user has been blocked due to excessive failed login attempts. [#428](https://github.com/fledge-iot/fledge-gui/pull/428)
- [FOGL-8684]: Support has been added to the GUI for key/value lists in configuration items. [#422](https://github.com/fledge-iot/fledge-gui/pull/422)
- [FOGL-8237]: A facility to read a JSON configuration item from a file and insert the contents into a configuration item has been added to the user interface. [#424](https://github.com/fledge-iot/fledge-gui/pull/424)
- [FOGL-8615]: An option to use the flow editor interface for notifications has been added. [#412](https://github.com/fledge-iot/fledge-gui/pull/412)
- [FOGL-8692]: Support for filter pipeline branches in north flow editor. [#418](https://github.com/fledge-iot/fledge-gui/pull/418)
- [FOGL-7783]: An option to the graph display to scroll to the most recent reading available. [#306](https://github.com/fledge-iot/fledge-gui/pull/306)

### Fixed

- [FOGL-8773]: Missing health icon indicator on the north service node to show the service status. [#418](https://github.com/fledge-iot/fledge-gui/pull/418)
- [FOGL-8825]: Extra GET notifications API call on Notification page load. [#430](https://github.com/fledge-iot/fledge-gui/pull/430)
- [FOGL-8673]: Notification Service delete issue in disabled mode. [#414](https://github.com/fledge-iot/fledge-gui/pull/414)

### Others

- New & updated Brand logo & favicon [#403](https://github.com/fledge-iot/fledge-gui/pull/403)
- UI/UX improvement and various functional bug fixes.

## v2.4.0 [2024-04-17]

### Added

- [FOGL-8583]: Added user interface support for kvlist with primitive value types (string, integer, float) config item types [#401](https://github.com/fledge-iot/fledge-gui/pull/401)

- [FOGL-8476]: Added user interface support for list config item types [#397](https://github.com/fledge-iot/fledge-gui/pull/397)

- [FOGL-8030]: Added visual programming feature for South Pages as Flow Editor [#359](https://github.com/fledge-iot/fledge-gui/pull/359)

- [FOGL-8492]: Added visual programming feature for North Pages as Flow Editor [#382](https://github.com/fledge-iot/fledge-gui/pull/382)

- [FOGL-8375]: Added a new page for managing additional services within an instance [#360](https://github.com/fledge-iot/fledge-gui/pull/360)

- [FOGL-8306]: Added a feature to show system alerts. GUI now shows the system alerts via an icon in the navigation bar [#389](https://github.com/fledge-iot/fledge-gui/pull/389)

- [FOGL-7947]: Added tab navigator buttons in plugin configuration page when there are configuration groups [#372](https://github.com/fledge-iot/fledge-gui/pull/372)

### Changed

- Added sidebar menu icons and updated internal pages icon with bootstrap icons [#383](https://github.com/fledge-iot/fledge-gui/pull/383) and [#384](https://github.com/fledge-iot/fledge-gui/pull/384)

### Fixed

- [FOGL-8578] Fixed codemirror JSON editor error for code type config item [#402](https://github.com/fledge-iot/fledge-gui/pull/402)

- [FOGL-8509] Made last side menu options visible when all options are in expanded state [#408](https://github.com/fledge-iot/fledge-gui/pull/408)

- [FOGL-8446] Fixed Control Pipeline disconnected filter discard issue [#387](https://github.com/fledge-iot/fledge-gui/pull/387)

- [FOGL-8401] Fixed create control script with an empty data in step values and order key [#370](https://github.com/fledge-iot/fledge-gui/pull/370)

- [FOGL-8384] Fixed re-enable next button issue on north, south and filter wizard [#371](https://github.com/fledge-iot/fledge-gui/pull/371)

### Others

- Changed the size of fledge brand logo [#403](https://github.com/fledge-iot/fledge-gui/pull/403)

## v2.3.0 [2023-12-28]

### Added

- [FOGL-8276]: Support for model selection configuration items [#355](https://github.com/fledge-iot/fledge-gui/pull/355)
- [FOGL-8340]: Added documentation links for online help on Control API Entry Points screens [#366](https://github.com/fledge-iot/fledge-gui/pull/366)

### Changed

- [FOGL-7948] Configuration page single tree structure for Categories. Removed the dropdown selector for root categories/parent groups [#330](https://github.com/fledge-iot/fledge-gui/pull/330)

### Fixed

- [FOGL-8342] Broken exported readings CSV file for the fields which contains comma [#361](https://github.com/fledge-iot/fledge-gui/pull/361)
- [FOGL-8199] Same name datapoints/attributes for different assets get merged in the graph display [#347](https://github.com/fledge-iot/fledge-gui/pull/347)

### Others

- [FOGL-8254]: Upgraded to Angular 16 (including compatible TypeScript / CLI versions) [#356](https://github.com/fledge-iot/fledge-gui/pull/356)
- Disable buttons on click while the corresponding API request is in progress, to avoid duplicate requests [#343](https://github.com/fledge-iot/fledge-gui/pull/343)

## v2.2.0 [2023-10-17]

### Added

- [FOGL-7553] GUI Configuration settings to define default time duration for readings graph [#274](https://github.com/fledge-iot/fledge-gui/pull/274)

- [FOGL-7509] When the backend system is not available then the user interface components are made non-interactive & blur [#265](https://github.com/fledge-iot/fledge-gui/pull/265)

- [FOGL-7555] Ability to choose & display other assets' data on readings graph

- [FOGL-7656] Control to pause auto refresh of readings data

- [FOGL-7659] Ability to see past data in charts

- [FOGL-7692] Granularity options in time duration for readings graph rendering

- [FOGL-7766] Width, height and depth information for image type data-points for the latest reading

- [FOGL-7897] Ability to zoom into a graph

- [FOGL-7905] Ability to collapse/expand menu items having child nodes

- [FOGL-7937] Request in-progress indicator for each readings & summary API call

- [FOGL-7678] Control Pipelines

- [FOGL-8115] Control API endpoints [#332](https://github.com/fledge-iot/fledge-gui/pull/332)

- [FOGL-8117] Viewing Southbound & Northbound service details from System logs page & details/logs from Health popover for services in failed/unresponsive state

### Changed

- [FOGL-7094] Display format of X-axis timestamps for one week data on readings graph

- [FOGL-7809] Improved filters configuration update mechanism

- [FOGL-7191] Restricted entry of quote characters in an entity name [#249](https://github.com/fledge-iot/fledge-gui/pull/249)

- [FOGL-7475] System Logs page search improvements to search data from backend through API [#270](https://github.com/fledge-iot/fledge-gui/pull/270)

- [FOGL-7368]: Added left & right slider indicator when configuration group tabs are not visible [#250](https://github.com/fledge-iot/fledge-gui/pull/250)

- [FOGL-8062] E2E tests migrated to cypress from protractor [#323](https://github.com/fledge-iot/fledge-gui/pull/323)

### Fixed

- [FOGL-7765] Latest reading in GUI does not show non-image data-points/attributes if an image is one of the data-points/attributes [#290](https://github.com/fledge-iot/fledge-gui/pull/290)

- [FOGL-7789] View role user allowed to perform add/update/delete action when logged in using certificate [#293](https://github.com/fledge-iot/fledge-gui/pull/293)

- [FOGL-7819] Validation check for mandatory configuration items in configuration tabs [#303](https://github.com/fledge-iot/fledge-gui/pull/303)

- [FOGL-6853] Text wrapping in the syslog display does not work with long words [#241](https://github.com/fledge-iot/fledge-gui/pull/241)

- [FOGL-7247] Code mirror editor zig-zag issue for large content of JSON/script/code type configuration items [#238](https://github.com/fledge-iot/fledge-gui/pull/238)

- [FOGL-7271] Getting error in console on Control Dispatcher page [#242](https://github.com/fledge-iot/fledge-gui/pull/242)

- [FOGL-7294] Unable to upload file/update value for script type configuration item, unless the name is `script`

### Others

- Included Bootstrap icons [#327](https://github.com/fledge-iot/fledge-gui/pull/327)

## v2.1.0 [2022-12-26]

#### Added

- [FOGL-7108] Role based access for view & data_view role users [#231](https://github.com/fledge-iot/fledge-gui/pull/231)
- [FOGL-7126] South and North instances's details modal configuration grouping based on group key [#234](https://github.com/fledge-iot/fledge-gui/pull/234)

#### Changed

- [FOGL-7049] Timestamps with YYYY-MM-DD for tabular data, latest reading and datapoint hover for assets & readings graphs [#217](https://github.com/fledge-iot/fledge-gui/pull/217)
- [FOGL-7193] Show assets collapsed by default on Southbound services page [#232](https://github.com/fledge-iot/fledge-gui/pull/232)

#### Fixed

- [FOGL-7065] Fixed add & update user for Administrator role [#227](https://github.com/fledge-iot/fledge-gui/pull/227)

#### Others

- Certificate based login modal UI improvements [#214](https://github.com/fledge-iot/fledge-gui/pull/214)

## v2.0.1 [2022-10-20]

#### Added

- [FOGL-6812] Parameterised URL support to connect & allow login in a secured instance [#206](https://github.com/fledge-iot/fledge-gui/pull/206)

#### Changed

- [FOGL-6994] Improved the way of showing build version and documentation help URL links for released vs nightly versions [#156](https://github.com/fledge-iot/fledge-gui/pull/156)

## v2.0.0 [2022-09-09]

#### Added

- [FOGL-6129] Support for Control Dispatcher service UI [#139](https://github.com/fledge-iot/fledge-gui/pull/139)
- [FOGL-6174] Assets image data visualization [#162](https://github.com/fledge-iot/fledge-gui/pull/162)
- Added developer features
  - [FOGL-6669] Support to manually purge assets readings [#188](https://github.com/fledge-iot/fledge-gui/pull/188)
  - [FOGL-6661] Support to view/export & import plugin's persisted data [#192](https://github.com/fledge-iot/fledge-gui/pull/192)
  - [FOGL-6720] Support to deprecate assets [#193](https://github.com/fledge-iot/fledge-gui/pull/193)
  - [FOGL-6785] Support to install Python package [#203](https://github.com/fledge-iot/fledge-gui/pull/203)
- [FOGL-6613] Support for ACL configuration item type which allows the selection from existing ACLs [#194] (https://github.com/fledge-iot/fledge-gui/pull/194)
- [FOGL-6108] Provided alpha control to specify the opacity for line colors in the asset readings graph [#134](https://github.com/fledge-iot/fledge-gui/pull/134)

#### Changed

- [FOGL-6595] Tabbed layout for services and north tasks with Advanced and Security configuration tabs [#184](https://github.com/fledge-iot/fledge-gui/pull/184)
- [FOGL-6463] Updated system log page design for better performance [#183](https://github.com/fledge-iot/fledge-gui/pull/183)
- [FOGL-6473] Provided refresh button to update the latest reading/image view [#176](https://github.com/fledge-iot/fledge-gui/pull/176)
- [FOGL-6171] Direct links to access service's syslogs [#148](https://github.com/fledge-iot/fledge-gui/pull/148)

#### Fixed

- [FOGL-6630] Edit issue for Script type configuration items [#187](https://github.com/fledge-iot/fledge-gui/pull/187)
- [FOGL-6276] Selected sidebar menu item highlight issue while navigating to child pages [#179](https://github.com/fledge-iot/fledge-gui/pull/179)
- [FOGL-5967] Editing masked input field for Time format [#125](https://github.com/fledge-iot/fledge-gui/pull/125)
- [FOGL-6144] Graphs erroneously merge gaps in time series data [#142](https://github.com/fledge-iot/fledge-gui/pull/142)
- [FOGL-6203] Sorting for disabled services on south page, after Fledge restart [#158](https://github.com/fledge-iot/fledge-gui/pull/158)
- [FOGL-3193] Timezone inconsistencies in the user interface [#132](https://github.com/fledge-iot/fledge-gui/pull/132)
- [FOGL-6839] JSON config copy issue between multiple JSON fields of a category [#205](https://github.com/fledge-iot/fledge-gui/pull/205)

#### Others

- Upgraded to Angular 13 (including compatible TypeScript / CLI versions)
- Added support for Micro Frontends/GUI extensions

## v1.9.2 [2021-09-29]

#### Added

- [FOGL-5534] Ability to paste into password type fields [#100](https://github.com/fledge-iot/fledge-gui/pull/100)
- [FOGL-5609] Script upload feature for South/North instances having script type configuration [#102](https://github.com/fledge-iot/fledge-gui/pull/102)
- [FOGL-5722] Prompt to accept the self-signed TLS certificate and run ping against the configured Fledge host connection settings over HTTPS [#108](https://github.com/fledge-iot/fledge-gui/pull/108)
- [FOGL-5872] Ability to upload a backup tarball for Fledge instance [#113](https://github.com/fledge-iot/fledge-gui/pull/113)
- [FOGL-5900]: Ability to have more granular control for auto refresh on log pages, for better filtering, search and text selection/copy experience

#### Changed

- [FOGL-5480] Allowed more extensions for Certificate files store [#101](https://github.com/fledge-iot/fledge-gui/pull/101)

#### Fixed

- [FOGL-5142] Packaging improvements, specifically for containerized environment [#105](https://github.com/fledge-iot/fledge-gui/pull/105/files)
- [FOGL-5523] Unexpected delete API call for a locally removed and re-added filter & Prompt to discard any local changes or save, while adding filter through wizard for South/North instances [#106](https://github.com/fledge-iot/fledge-gui/pull/106)
- [FOGL-5832] Ping issue & apperance of login screen, when configured host & port do not refer to a valid Fledge instance [#110](https://github.com/fledge-iot/fledge-gui/pull/110)

## v1.9.1 [2021-05-27]

#### Added

- [FOGL-5097]: Added documentation links for online help on various screens (#71, #73, #77)
- Show refresh icon next to 'add & enable now' link on Notification page (#75)
- [FOGL-5260]: Added filter to see externally added services logs (#79)

#### Changed

- [FOGL-4434]: Improvements have been made in the user management screens (#80)
- [FOGL-5403]: Removed delete option in certificate store page for non-admin user (#88)

#### Fixed

- [FOGL-5027]: Fixed update schedule issue which was due to time field (#69)
- Fixed South page to list services sorted by name (#70)
- [FOGL-5198]: Fixed nested readings data parsing issue for tabular data display & CSV download (#82)

## v1.9.0 [2021-02-17]

#### Added

- [FOGL-3921] Connected Fledge version information on navbar brand name hover & on settings page (#52)
- [FOGL-4704] Documentation help links (#39)
- [FOGL-4721] Northbound always on services support in North pages (#42)
- [FOGL-4119] Contribution statement
- [FOGL-4815] System logs severity filter option "Debug and above" added, default level set to "Info and above" (#51)

#### Changed

- [FOGL-4779] Type handling for Notification plugins (#41)
- [FOGL-4586] Package installation mechanism, using asynchronous API support (#38)

#### Fixed

- [FOGL-4420] Removed repeat field for manual and startup schedule (#29)
- [FOGL-4863] Allow to set retrigger time while adding a notification instance (#53)

#### Others

- Updated bulma css framework to 0.8.2 (#18)

## v1.8.2 [2020-11-03]

This release is to keep versions in sync with Fledge core. There are no functional/visual changes or any bug fix.

## v1.8.1 [2020-07-08]

#### Fixed

- Password view option with validation message on confirm password in South Pages

## v1.8.0 [2020-05-08]

#### Added

- Python editor with light and dark mode support for `script` & `code` types
- Option to show all accumulated audit logs for event engine in Notification Logs page
- Support to upload .cert, .cer, .crt & .pem certificate file without key file
- Support for configuration item validity expression
- Log link in alert for packages logs
- Support for mandatory attribute of config item
- Better control to Add, Enable / Disable the Notification Service
- Filtering by service and task in System logs page, and local search facility

#### Changed

- Upgraded to Angular 8 (including compatible TypeScript / CLI versions)
- Improved Notification and Audit Logs

#### Fixed

- Fixed deletion of filter from pipeline on north instances
- Fixed memory leak issue with pages having auto refresh feature
- Fixed wrong API call to show category children for root categories
- Fixed notification service install and enabled state checks
- Fixed readings timestamp display issue on safari browser
- Fixed data persistence issue on add notification instance page
- Fixed multiple API network calls issue for notification instance creation
- Fixed issue in login with certificate
- Fixed legend state on graph refresh
- Fixed audit logs pagination issue
- Fixed broken graphs when time passes (00:00:00) midnight

## v1.7.0 [2019-08-15]

#### Added

- Allow login using certificate
- Interface to install plugins on South, North, Filters and Notification page
- Display the plugin name and version on South and North page
- Support for password configuration items
- JSON editor for config items of type json
- Support to update python script
- New log tabs for Notification and Packages under logs section
- Link added in alert to show failure logs

#### Changed

- Updated asset reading page to show textual data

#### Fixed

- Fixed upload script issue for notification instances
- Fixed wrong time on graph data for the past reading
- Fixed save multiple filter configuration at once
- Fixed csv format for asset readings download
- Fixed RPM package installation conflict issue

## v1.6.0 [2019-05-22]

#### Added

- Red Hat Support and required RPM packaging
- 3D surface graph support for FFT spectrum
- Certificate Store allows PEM and JSON certificates
- More options for elapsed time in readings graph

#### Fixed

- Assorted UI/UX issues and Nicer Dropdown

## v1.5.2 [2019-04-08]

#### Added

- Notifications UI

#### Fixed

- Backup creation time format

## v1.5.1 [2019-03-12]

#### Added

- Advanced Configuration in North instance modal
- Added build version info on settings page

#### Fixed

- Certificate store upload issue
- Allow negative numbers to be entered in numeric fields
- HTTP Error (4xx / 5xx) response handling
- Days info in uptime

## v1.5.0 [2019-02-07]

#### Added

- Functionality to delete South service and North instance
- Functionality to export readings to csv file, for South service and Asset
- Service health status on mouse hover on the green/yellow/grey/red traffic light in the navbar
- Advanced Configuration in South service modal
- Support for `script` type configuration item
- Support for the usage of `displayName` for configuration categories and items
- Support to add Data Processing Applications (filter)
- Show `SAFE MODE` label in navbar if Fledge is running in safe mode

#### Changed

- Improved save functionality for configuration items to use category bulk update api
- Upgraded to Angular 7 (including compatible TypeScript / CLI versions)

#### Removed

- Empty validation check on save configuration items

#### Fixed

- Improved South service and North instance setup wizard

## v1.4.0 [2018-09-25]

#### Added

- Dedicated South and North menu options to see existing instances, with the ability to change configuration, enable or disable them and corresponding ingress / egress stats
- Ability to create a South plugin service or North plugin task instance via Wizard
- Ping based statistics info in top navigation bar
- Log level filter option in syslog

#### Changed

- Revamped configuration page
- Latest Task list with status info moved under Logs

#### Removed

- Create / Delete schedule ability
- Services Health Page

#### Fixed

- Improved Graph with time based filters and auto refresh functionality
- Misc performance improvements and visual changes

## v1.3.0 [2018-07-09]

#### Added

- HTML reports for e2e tests `fledge-gui/e2e-test-report/report.html`
- Add new service interface to load a south plugin [Basic]
- `./make_deb` script to create debian package `packages/Debian/build`

#### Changed

- Upgraded to Angular 6 (including compatible TypeScript / CLI versions)
- No login window with skip option will appear, If authentication is not mandatory
- Fledge instance status label will show the lock icon, If authentication is mandatory and allowPing is false, until you are logged in
- Auto-configuration of IP / host address, so you should be able to have instant access of Fledge instance with https://rasperrypi.local (whatever the host address is) and you shall not need to go to settings and "Set the URL & Restart"
- Removed milliseconds from Statistics History Graphs on dashboard
- Added refresh icon button on asset readings graph
- On configuration item the cancel button is hidden by default, instead of disabled and will appear on change
- Renamed `deploy.sh` and `build.sh` to `deploy` and `build` respectively
- Default limit for asset readings set to 100
- Asset readings graph will appear instantly, no click required

#### Removed

- Input mask external lib

#### Fixed

- Support bundles download when authentication is mandatory
- Refresh action for Statistics History Graphs on dashboard
- Fixed Syslog display order
- and squashed many more including visual appearance and session related issues :]

#### Known Issues

- LogOut all active session not working for non-admin user (REST endpoint bug)

## v1.2

#### Features Addition

- Add configuration item support
- Enable / Disable Schedule
- Improved Services Health Page
- Auth Support
- User Management
- Support Bundles
- Backup and Restore
- Syslog (Logs)
- Certificate Store
- Allows Statistics History Graph (selection for display)
- Added refresh icons for each component to fetch latest
- Allows test connection for instance connection
- Ping is configurable now in settings (default to every 5 seconds)
- Added asset reading info tooltip on status tag in navbar
- Added e2e tests for default checks
- Added [deploy.sh](https://github.com/fledge/fledge-gui/blob/1.2.0/deploy.sh), see [Issue-73](https://github.com/fledge/fledge-gui/issues/73)

#### Bug Fixes

- REST API error handling
- Running task cancellation, confirmation dialog
- Create / Update schedule modal overlapping issue on iPhone
- and squashed many more :]

#### Known Issues

- Support bundles download via browser is not possible when authentication is mandatory (Please use curl request manually with authorization token header)

## v1.1.1

#### Bug Fixes

- Configuration Management:
  - Category items alignment issue
  - JSON (object) display and save issue
- Updated Readme

## v1.1

- Statistics History Graphs
- Configuration Management
- Schedules and Tasks
- Audit Logs
- Assets and Readings data browsing with graphs
- Allow to connect any Fledge instance via Settings
