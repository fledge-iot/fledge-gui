AI Prompt: Generate Fledge Dashboard Component

Create dashboard component, with a separate link on sidebar for monitoring IoT system statistics with the following specifications:

Dashboard Layout Structure
1. System Overview Section (Stats Cards)
Create 8 metric cards in a 2-row layout (4 cards per row):

Row 1:
- Data Sources Card: Shows total south services count with disabled indicator badge
- Total Assets Card: Displays total system assets
- Total Datapoints Card: Shows aggregated datapoint count
- Integrations Card: Shows total north services with disabled indicator badge

Row 2:
- Received Readings Count Card: Shows data received from ping API
- Sent Readings Count Card: Shows data sent from ping API  
- Purged Readings Count Card: Shows data purged count
- Active Alerts Card: Shows alert count with hover tooltip displaying alert details

Card Features:
- Click navigation to respective pages
- Color-coded themes (light blue for data sources, light purple for integrations)
- Disabled service indicators in top-right corners
- Icons from Bootstrap Icons and custom SVG assets
- Glassmorphism design with gradient backgrounds and backdrop blur
- Hover animations with translateY and shadow effects

2. Statistics History Section (Time-Series Charts)
Layout:
- Collapsible section with expand/collapse functionality
- Special Chart: "Received vs Sent" area chart always displayed at top
- Dynamic Charts: User-selectable statistics displayed as line charts
- Responsive Layout: Single chart (full width) for 1 selection, 3-per-row for multiple

Chart Controls:
- Multi-select Dropdown: Checkbox-based selection for statistics keys
- Time Range Selector: 10min/30min/60min options

Chart Features:
- Chart.js integration with custom color schemes
- Loading overlays with spinners
- Responsive canvas sizing
- Browser timezone conversion for timestamps
- Smooth animations and hover effects

3. Error Rate Monitoring Section (Collapsible)
   - Error rate summary cards (Error Rate %, Total Errors, Discarded Services, Failed Operations)
   - Error rate trends chart with multiple data series
   - Service error breakdown showing errors per service

4. System Health Section (Collapsible)
   - Resource usage cards (CPU, Memory, Disk, Services Running)
   - Service health status table with real service data
   - Color-coded status indicators

5. System Logs Section (Collapsible)
Filter Controls (3-column layout):
- Service Dropdown: Filter by service name
- Level Dropdown: Filter by log level (Debug/Info/Warning/Error and above)
- Search Input: Free text search

Log Table:
- Columns: Timestamp, Level, Service, Message
- Styling: Sticky header, hover effects, monospace font for messages
- Level Tags: Color-coded severity badges matching system log component

Pagination:
- Controls: "Newer", "Older", "First" buttons
- Logic: 50 entries per page with offset-based navigation

Technical Implementation Requirements:
API Integration
- GET /fledge/asset (assets count)
- GET /fledge/south (south services)
- GET /fledge/north (north services) 
- GET /fledge/statistics (current stats)
- GET /fledge/statistics/history (time-series data)
- GET /fledge/ping (received/sent/purged counts)
- GET /fledge/syslog (system logs with pagination)
- GET /fledge/alert (system alerts)

Log Parsing Logic
Implement regex-based log parsing to extract:
- Timestamps: in the YYYY-MM-DD HH:MM:SS format
- Log Levels: DEBUG, INFO, WARNING, ERROR, FATAL, EXCEPTION
- Service Names: Extract from "servicename[pid]" format
- Messages: Clean content with service patterns removed