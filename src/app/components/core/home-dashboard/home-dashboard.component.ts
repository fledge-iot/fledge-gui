import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, AfterViewInit, inject, signal, computed, HostListener, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { interval, Subject, combineLatest, of, Subscription } from 'rxjs';
import { takeUntil, catchError, take, distinctUntilChanged } from 'rxjs/operators';

import { AlertService, AssetsService, NorthService, ServicesApiService, StatisticsService, PingService, SystemAlertService } from '../../../services';
import { TimezoneService } from '../../../services/timezone.service';
import { DateFormatterPipe } from '../../../pipes';
import { SharedModule } from '../../../shared.module';
import { PipesModule } from '../../../pipes/pipes.module';
import { LogsModule } from '../logs/logs.module';
import { SystemLogComponent } from '../logs/system-log/system-log.component';

Chart.register(...registerables);

interface StatsSummary {
    totalAssets: number;
    totalSouthServices: number;
    totalNorthServices: number;
    totalDatapoints: number;
    receivedCount: number;
    sentCount: number;
    purgedCount: number;
    alertsCount: number;
    southServicesEnabled: number;
    southServicesDisabled: number;
    northServicesEnabled: number;
    northServicesDisabled: number;
}

interface StatsHistoryData {
    labels: string[];
    datasets: any[];
}

interface FilterOptions {
    timeRange: '10min' | '30min' | '60min';
    selectedKeys: string[];
}

@Component({
    selector: 'app-home-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, SharedModule, PipesModule, LogsModule],
    providers: [
        AlertService,
        AssetsService,
        NorthService,
        ServicesApiService,
        StatisticsService,
        PingService,
        TimezoneService,
        DateFormatterPipe,
        SystemAlertService
    ],
    templateUrl: './home-dashboard.component.html',
    styleUrls: ['./home-dashboard.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
    private alertService = inject(AlertService);
    private assetsService = inject(AssetsService);
    private northService = inject(NorthService);
    private servicesApiService = inject(ServicesApiService);
    private statisticsService = inject(StatisticsService);
    private pingService = inject(PingService);
    private dateFormatter = inject(DateFormatterPipe);
    private timezoneService = inject(TimezoneService);
    private router = inject(Router);
    private systemAlertService = inject(SystemAlertService);

    private destroy$ = new Subject<void>();
    private charts: Chart[] = [];
    private autoRefreshSubscription?: Subscription;
    private systemLogsInitialized = false;

    // Signals for reactive state management
    statsSummary = signal<StatsSummary>({
        totalAssets: 0,
        totalSouthServices: 0,
        totalNorthServices: 0,
        totalDatapoints: 0,
        receivedCount: 0,
        sentCount: 0,
        purgedCount: 0,
        alertsCount: 0,
        southServicesEnabled: 0,
        southServicesDisabled: 0,
        northServicesEnabled: 0,
        northServicesDisabled: 0
    });

    statistics = signal<any[]>([]);
    statisticsHistory = signal<any[]>([]);
    loading = signal(false);
    isStatsDropdownOpen = signal(false);
    chartsLoading = signal<boolean[]>([]);
    isStatsHistoryExpanded = signal(true);
    isSystemLogsExpanded = signal(true);
    isAutoRefreshEnabled = signal(true);

    // Parsed system logs for table display
    parsedSystemLogs = signal<any[]>([]);

    // Pagination properties for system logs
    systemLogsPage = signal(1);
    systemLogsLimit = 50;
    systemLogsOffset = signal(0);

    // Filter properties for system logs
    systemLogsSource = signal('');
    systemLogsLevel = signal('warning');
    systemLogsKeyword = signal('');
    availableServices = signal<string[]>([]);

    // Add alerts data for hover functionality
    systemAlerts = signal<any[]>([]);
    showAlertsTooltip = signal(false);
    private alertsTooltipTimeout?: number;

    // Filter options
    filterOptions = signal<FilterOptions>({
        timeRange: '30min',
        selectedKeys: []
    });

    // Computed properties
    availableKeys = computed(() => {
        return this.statistics()
            .map(stat => stat.key)
            .filter(key => key && key !== 'READINGS');
    });

    @ViewChild(SystemLogComponent) systemLogComponent!: SystemLogComponent;

    ngOnInit() {
        this.loadInitialData();
        this.setupAutoRefresh();
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();

        this.destroyCharts();
        this.stopAutoRefresh();

        // Clean up alerts tooltip timeout
        if (this.alertsTooltipTimeout) {
            clearTimeout(this.alertsTooltipTimeout);
            this.alertsTooltipTimeout = undefined;
        }
    }

    ngAfterViewInit() {
        // SystemLogComponent is now always available in DOM (just hidden/shown)
        // Initialize it immediately and disable its auto-refresh
        setTimeout(() => {
            if (this.systemLogComponent && !this.systemLogsInitialized) {
                // Disable the SystemLogComponent's auto-refresh to prevent continuous calls
                this.systemLogComponent.toggleAutoRefresh(false);

                // Set our local auto-refresh state to false initially
                this.isAutoRefreshEnabled.set(false);

                // Load initial data once
                this.systemLogComponent.getSysLogs();
                this.systemLogComponent.getSchedules();

                // Parse initial logs after a short delay
                setTimeout(() => {
                    this.parseSystemLogsData();
                    this.updateAvailableServices();
                }, 1000);

                // Mark as initialized to prevent multiple calls
                this.systemLogsInitialized = true;
            }
        });
    }

    private destroyCharts() {
        this.charts.forEach(chart => {
            if (chart) {
                chart.destroy();
            }
        });
        this.charts = [];
    }

    private loadInitialData() {
        this.loading.set(true);
        this.loadStatsSummary();
        this.loadStatistics();
        this.loadStatisticsHistory();
    }

    private setupAutoRefresh() {
        // Don't start auto-refresh automatically
        // It will be controlled by the auto-refresh checkbox
    }

    private startAutoRefresh() {
        // Stop any existing auto-refresh
        this.stopAutoRefresh();

        // Start new auto-refresh interval
        this.autoRefreshSubscription = interval(30000)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                this.loadStatsSummary();
                this.loadStatistics();
                this.loadStatisticsHistory();
                // Parse system logs after refresh
                setTimeout(() => {
                    this.parseSystemLogsData();
                    this.updateAvailableServices();
                }, 1000);
            });
    }

    private stopAutoRefresh() {
        if (this.autoRefreshSubscription) {
            this.autoRefreshSubscription.unsubscribe();
            this.autoRefreshSubscription = undefined;
        }
    }

    private loadStatsSummary() {
        combineLatest([
            this.assetsService.getAsset().pipe(catchError(() => of([]))),
            this.servicesApiService.getSouthServices(false).pipe(catchError(() => of({ services: [] }))),
            this.northService.getNorthTasks(false).pipe(catchError(() => of([])))
        ]).pipe(
            takeUntil(this.destroy$)
        ).subscribe(([assets, southServices, northTasks]) => {
            // Calculate total datapoints from assets (each asset represents multiple datapoints)
            // For now, we'll use the asset count as a placeholder for datapoints
            // In a real scenario, you might need to call a specific API to get actual datapoint counts
            const totalDatapoints = Array.isArray(assets) ? assets.reduce((total, asset) => total + (asset.count || 1), 0) : 0;

            // Calculate south services status breakdown
            const southServicesArray = (southServices as any)?.services || [];
            const southServicesEnabled = southServicesArray.filter((service: any) => service.schedule_enabled === true).length;
            const southServicesDisabled = southServicesArray.filter((service: any) => service.schedule_enabled === false).length;

            // Calculate north services status breakdown
            const northTasksArray = Array.isArray(northTasks) ? northTasks : [];
            const northServicesEnabled = northTasksArray.filter((task: any) => task.enabled === true).length;
            const northServicesDisabled = northTasksArray.filter((task: any) => task.enabled === false).length;

            this.statsSummary.update(current => ({
                ...current,
                totalAssets: Array.isArray(assets) ? assets.length : 0,
                totalSouthServices: southServicesArray.length,
                totalNorthServices: northTasksArray.length,
                totalDatapoints: totalDatapoints,
                southServicesEnabled: southServicesEnabled,
                southServicesDisabled: southServicesDisabled,
                northServicesEnabled: northServicesEnabled,
                northServicesDisabled: northServicesDisabled
            }));

            this.loading.set(false);
        });

        // Load ping data separately to avoid continuous calls
        this.loadPingData();
    }

    private loadPingData() {
        // Call ping service directly to get the actual data
        this.pingService.pingService()
            .then((pingData: any) => {
                this.statsSummary.update(current => ({
                    ...current,
                    receivedCount: pingData?.dataRead || 0,
                    sentCount: pingData?.dataSent || 0,
                    purgedCount: pingData?.dataPurged || 0,
                    alertsCount: pingData?.alerts || 0
                }));
            })
            .catch((error) => {
                // Handle error - set values to 0 if ping fails
                this.statsSummary.update(current => ({
                    ...current,
                    receivedCount: 0,
                    sentCount: 0,
                    purgedCount: 0,
                    alertsCount: 0
                }));
            });
    }

    private loadStatistics() {
        this.statisticsService.getStatistics()
            .pipe(
                takeUntil(this.destroy$),
                catchError(error => {
                    this.alertService.error('Failed to load statistics');
                    return of([]);
                })
            )
            .subscribe(data => {
                // Filter out FOGBENCH data
                const filteredStats = Array.isArray(data)
                    ? data.filter((stat: any) => !stat.key?.toLowerCase().includes('fogbench'))
                    : [];
                this.statistics.set(filteredStats);
            });
    }

    private loadStatisticsHistory() {
        const filters = this.filterOptions();
        const timeInMinutes = parseInt(filters.timeRange.replace('min', ''));

        this.statisticsService.getStatisticsHistory(timeInMinutes)
            .pipe(
                takeUntil(this.destroy$),
                catchError(error => {
                    this.alertService.error('Failed to load statistics history');
                    return of({ statistics: [] });
                })
            )
            .subscribe(data => {
                this.statisticsHistory.set((data as any)?.statistics || []);
                this.updateChart();
            });
    }

    private updateChart() {
        const history = this.statisticsHistory();
        const filters = this.filterOptions();

        if (!history.length) return;

        // Set loading state for charts (only readings vs sent chart + selected keys)
        const totalCharts = filters.selectedKeys.length + 1; // +1 for readings vs sent chart
        const loadingStates = new Array(totalCharts).fill(true);
        this.chartsLoading.set(loadingStates);

        // Destroy existing charts
        this.destroyCharts();

        // Small delay to ensure DOM is updated before creating charts
        setTimeout(() => {
            // Always create the "Readings vs Sent" chart first
            this.createReadingsVsSentChart(history);

            // Create individual charts for each selected key (if any)
            filters.selectedKeys.forEach((key, index) => {
                this.createChart(key, index + 1, history); // +1 to account for readings vs sent chart
            });
        }, 100);
    }

    private createChart(key: string, index: number, history: any[]) {
        const chartId = `statsChart-${index}`;
        const ctx = document.getElementById(chartId) as HTMLCanvasElement;
        if (!ctx) return;

        const labels = history.map(item => {
            return this.dateFormatter.transform(item.history_ts, 'HH:mm:ss');
        });

        const color = this.getChartColor(index);
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: key,
                    data: history.map(item => item[key] || 0),
                    borderColor: color,
                    backgroundColor: color + '30',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2,
                    pointBackgroundColor: color,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    onComplete: () => {
                        // Mark this chart as loaded
                        this.chartsLoading.update(loadingStates => {
                            const newStates = [...loadingStates];
                            newStates[index] = false;
                            return newStates;
                        });
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: key
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Count'
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Time'
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });

        this.charts.push(chart);
    }

    private getChartColor(index: number): string {
        const colors = [
            '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
            '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'
        ];
        return colors[index % colors.length];
    }

    // Event handlers
    onTimeRangeChange(timeRange: '10min' | '30min' | '60min') {
        this.filterOptions.update(filters => ({ ...filters, timeRange }));
        this.loadStatisticsHistory();
    }

    onKeySelectionChange(selectedKeys: string[]) {
        this.filterOptions.update(filters => ({ ...filters, selectedKeys }));
        this.updateChart();
    }

    onMultiSelectChange(event: Event) {
        const selectElement = event.target as HTMLSelectElement;
        const selectedKeys = Array.from(selectElement.selectedOptions).map(option => option.value);
        this.onKeySelectionChange(selectedKeys);
    }

    onStatsCheckboxChange(key: string, checked: boolean) {
        const currentKeys = this.filterOptions().selectedKeys;
        let newKeys: string[];

        if (checked) {
            newKeys = [...currentKeys, key];
        } else {
            newKeys = currentKeys.filter(k => k !== key);
        }

        // No need to ensure at least one key is selected since we always show "Readings vs Sent"
        this.onKeySelectionChange(newKeys);
    }

    toggleStatsDropdown() {
        this.isStatsDropdownOpen.update(isOpen => !isOpen);
    }

    closeStatsDropdown() {
        this.isStatsDropdownOpen.set(false);
    }

    toggleStatsHistorySection() {
        this.isStatsHistoryExpanded.update(isExpanded => !isExpanded);

        // If collapsing, destroy charts to free memory
        if (!this.isStatsHistoryExpanded()) {
            this.destroyCharts();
        } else {
            // If expanding, reload charts
            this.loadStatisticsHistory();
        }
    }

    toggleSystemLogsSection() {
        this.isSystemLogsExpanded.update(isExpanded => !isExpanded);
        // No need for initialization logic since component is always available
        // The component is just hidden/shown with [hidden] directive
    }

    toggleAutoRefresh(enabled: boolean) {
        this.isAutoRefreshEnabled.set(enabled);

        if (enabled) {
            this.startAutoRefresh();
            // Also enable SystemLogComponent's auto-refresh if it's initialized
            if (this.systemLogComponent && this.systemLogsInitialized) {
                this.systemLogComponent.toggleAutoRefresh(true);
            }
        } else {
            this.stopAutoRefresh();
            // Also disable SystemLogComponent's auto-refresh if it's initialized
            if (this.systemLogComponent && this.systemLogsInitialized) {
                this.systemLogComponent.toggleAutoRefresh(false);
            }
        }
    }

    // Add a method to manually refresh system logs
    refreshSystemLogs() {
        if (this.systemLogComponent) {
            this.systemLogComponent.getSysLogs();
            this.systemLogComponent.getSchedules();
            // Parse the logs and update services after refresh
            setTimeout(() => {
                this.parseSystemLogsData();
                this.updateAvailableServices();
            }, 500);
        }
    }

    // Pagination methods for system logs
    onSystemLogsNewer() {
        if (this.systemLogsOffset() > 0) {
            const newPage = this.systemLogsPage() - 1;
            this.systemLogsPage.set(newPage);
            const newOffset = Math.max(0, (newPage - 1) * this.systemLogsLimit);
            this.systemLogsOffset.set(newOffset);
            this.loadSystemLogsPage();
        }
    }

    onSystemLogsOlder() {
        const newPage = this.systemLogsPage() + 1;
        this.systemLogsPage.set(newPage);
        const newOffset = (newPage - 1) * this.systemLogsLimit;
        this.systemLogsOffset.set(newOffset);
        this.loadSystemLogsPage();
    }

    onSystemLogsFirst() {
        this.systemLogsPage.set(1);
        this.systemLogsOffset.set(0);
        this.loadSystemLogsPage();
    }

    private loadSystemLogsPage() {
        if (this.systemLogComponent) {
            // Update the SystemLogComponent's pagination properties
            this.systemLogComponent.page = this.systemLogsPage();
            this.systemLogComponent.offset = this.systemLogsOffset();
            this.systemLogComponent.limit = this.systemLogsLimit;

            // Update filter properties
            this.systemLogComponent.source = this.systemLogsSource();
            this.systemLogComponent.level = this.systemLogsLevel();
            this.systemLogComponent.keyword = this.systemLogsKeyword();

            // Trigger the logs reload
            this.systemLogComponent.getSysLogs();

            // Parse the logs after reload
            setTimeout(() => {
                this.parseSystemLogsData();
            }, 500);
        }
    }

    private parseSystemLogsData() {
        if (this.systemLogComponent && this.systemLogComponent.logs) {
            // Debug: log the first few raw log entries
            console.log('Raw system logs (first 3):', this.systemLogComponent.logs.slice(0, 3));

            const parsedLogs = this.systemLogComponent.logs.map((logString: string) => {
                return this.parseLogEntry(logString);
            });
            this.parsedSystemLogs.set(parsedLogs);

            // Debug: log the first few parsed entries
            console.log('Parsed system logs (first 3):', parsedLogs.slice(0, 3));
        }
    }

    private formatTimestamp(timestamp: string): string {
        if (!timestamp || timestamp.trim() === '') {
            return '';
        }

        try {
            const cleanTimestamp = timestamp.trim();

            // Add debugging to see what timestamps we're getting
            console.log('Raw timestamp:', cleanTimestamp);

            // Check if it's already in a good format and just return it
            // Most system logs might already be in local time
            if (cleanTimestamp.match(/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/)) {
                // It's already in YYYY-MM-DD HH:mm:ss format, try to convert to browser time
                try {
                    const formatted = this.dateFormatter.transform(cleanTimestamp, 'YYYY-MM-DD HH:mm:ss');
                    console.log('Formatted timestamp:', formatted);
                    return formatted || cleanTimestamp;
                } catch (error) {
                    console.warn('DateFormatter failed for:', cleanTimestamp, error);
                    return cleanTimestamp;
                }
            }

            // For other patterns, try to parse and format
            if (cleanTimestamp.match(/^[A-Za-z]{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}/)) {
                // MMM DD HH:mm:ss format - add current year
                const currentYear = new Date().getFullYear();
                const timestampWithYear = `${currentYear} ${cleanTimestamp}`;
                const date = new Date(timestampWithYear);
                if (!isNaN(date.getTime())) {
                    try {
                        const formatted = this.dateFormatter.transform(date.toISOString(), 'YYYY-MM-DD HH:mm:ss');
                        console.log('Formatted MMM timestamp:', formatted);
                        return formatted || cleanTimestamp;
                    } catch (error) {
                        console.warn('DateFormatter failed for MMM format:', cleanTimestamp, error);
                        return cleanTimestamp;
                    }
                }
            }

            // If no specific pattern matches, just return the original
            console.log('No pattern matched, returning original:', cleanTimestamp);
            return cleanTimestamp;

        } catch (error) {
            console.warn('Timestamp formatting failed for:', timestamp, error);
            return timestamp;
        }
    }

    private parseLogEntry(logString: string): any {
        // Remove HTML tags first
        const cleanLog = logString.replace(/<[^>]*>/g, '');

        const logEntry = {
            timestamp: '',
            level: '',
            service: '',
            message: '',
            rawLog: cleanLog,
            levelClass: ''
        };

        try {
            // Try multiple timestamp patterns
            let timestampMatch = null;

            // Pattern 1: YYYY-MM-DD HH:mm:ss.SSS
            timestampMatch = cleanLog.match(/(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\.\d{3})/);

            // Pattern 2: YYYY-MM-DD HH:mm:ss
            if (!timestampMatch) {
                timestampMatch = cleanLog.match(/(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})/);
            }

            // Pattern 3: MMM DD HH:mm:ss (e.g., "Jan 15 10:30:45")
            if (!timestampMatch) {
                timestampMatch = cleanLog.match(/([A-Za-z]{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})/);
            }

            // Pattern 4: DD-MM-YYYY HH:mm:ss
            if (!timestampMatch) {
                timestampMatch = cleanLog.match(/(\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}:\d{2})/);
            }

            // Pattern 5: Any date-like pattern at the beginning
            if (!timestampMatch) {
                timestampMatch = cleanLog.match(/^([^\s]+\s+[^\s]+\s+[^\s]+)/);
            }

            if (timestampMatch) {
                const rawTimestamp = timestampMatch[1];
                logEntry.timestamp = this.formatTimestamp(rawTimestamp);
                // Debug logging (remove in production)
                if (logEntry.timestamp === rawTimestamp) {
                    console.log('Timestamp not formatted:', rawTimestamp);
                }
            } else {
                // If no timestamp found, try to extract first part before any known log level
                const beforeLevel = cleanLog.split(/\s+(DEBUG|INFO|WARNING|ERROR|FATAL|EXCEPTION):/)[0];
                if (beforeLevel && beforeLevel !== cleanLog) {
                    const rawTimestamp = beforeLevel.trim();
                    logEntry.timestamp = this.formatTimestamp(rawTimestamp);
                    // Debug logging (remove in production)
                    if (logEntry.timestamp === rawTimestamp) {
                        console.log('Fallback timestamp not formatted:', rawTimestamp);
                    }
                }
            }

            // Extract level (DEBUG, INFO, WARNING, ERROR, FATAL, EXCEPTION)
            const levelMatch = cleanLog.match(/(DEBUG|INFO|WARNING|ERROR|FATAL|EXCEPTION):/);
            if (levelMatch) {
                logEntry.level = levelMatch[1];
                logEntry.levelClass = this.getLevelClass(levelMatch[1]);
            }

            // Extract service name if present - format: servicename[pid]
            const serviceMatch = cleanLog.match(/([a-zA-Z_][a-zA-Z0-9_-]*)\[(\d+)\]/);
            if (serviceMatch) {
                logEntry.service = serviceMatch[1]; // Service name is the first capture group
            } else {
                // Fallback: try to find any word followed by brackets
                const fallbackMatch = cleanLog.match(/(\w+)\[\d+\]/);
                if (fallbackMatch) {
                    logEntry.service = fallbackMatch[1];
                }
            }

            // Extract message (everything after level and optional service)
            let messageStart = cleanLog.indexOf(':');
            if (messageStart !== -1 && logEntry.level) {
                // Find the position after the level
                const levelIndex = cleanLog.indexOf(logEntry.level + ':');
                if (levelIndex !== -1) {
                    let message = cleanLog.substring(levelIndex + logEntry.level.length + 1).trim();
                    // Remove service[pid] pattern from message if it's at the beginning
                    if (logEntry.service) {
                        // Remove patterns like "servicename[1234] " from the start of message
                        message = message.replace(new RegExp(`^${logEntry.service}\\[\\d+\\]\\s*`), '');
                    }
                    logEntry.message = message;
                }
            }

            // If parsing fails, use the whole string as message
            if (!logEntry.message) {
                logEntry.message = cleanLog;
            }

        } catch (error) {
            // Fallback: use raw log as message
            logEntry.message = cleanLog;
            logEntry.level = 'INFO';
            logEntry.levelClass = 'is-info';
        }

        return logEntry;
    }

    private getLevelClass(level: string): string {
        switch (level) {
            case 'DEBUG':
                return 'is-light tag-syslog';
            case 'INFO':
                return 'is-white tag-syslog';
            case 'WARNING':
                return 'is-light is-warning tag-syslog';
            case 'ERROR':
            case 'FATAL':
            case 'EXCEPTION':
                return 'is-light is-danger tag-syslog';
            default:
                return 'is-light tag-syslog';
        }
    }

    getSelectedKeysDisplay(): string {
        const selected = this.filterOptions().selectedKeys;
        if (selected.length === 0) return 'Select Additional Statistics';
        if (selected.length === 1) return selected[0];
        return `${selected.length} selected`;
    }

    refreshData() {
        this.loadInitialData();
    }

    trackByStatKey(index: number, key: string): string {
        return key;
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: Event) {
        const target = event.target as HTMLElement;
        if (!target.closest('.dropdown')) {
            this.closeStatsDropdown();
        }
    }

    private syncAutoRefreshState() {
        if (this.systemLogComponent) {
            this.isAutoRefreshEnabled.set(this.systemLogComponent.isAlive);
        }
    }

    private createReadingsVsSentChart(history: any[]) {
        const chartId = 'readingsVsSentChart';
        const ctx = document.getElementById(chartId) as HTMLCanvasElement;
        if (!ctx) return;

        const labels = history.map(item => {
            return this.dateFormatter.transform(item.history_ts, 'HH:mm:ss');
        });

        const readingsColor = this.getChartColor(0);
        const sentColor = this.getChartColor(1);

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'READINGS',
                    data: history.map(item => item.READINGS || 0),
                    borderColor: readingsColor,
                    backgroundColor: readingsColor + '30',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2,
                    pointBackgroundColor: readingsColor,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }, {
                    label: 'SENT',
                    data: history.map(item => item.SENT || 0),
                    borderColor: sentColor,
                    backgroundColor: sentColor + '30',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2,
                    pointBackgroundColor: sentColor,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    onComplete: () => {
                        // Mark this chart as loaded
                        this.chartsLoading.update(loadingStates => {
                            const newStates = [...loadingStates];
                            newStates[0] = false;
                            return newStates;
                        });
                    }
                },
                plugins: {
                    title: {
                        display: false
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Count'
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Time'
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });

        this.charts.push(chart);
    }

    // Filter methods for system logs
    onSystemLogsFilterChange(filter: string, value: string) {
        // Reset to first page when filter changes
        this.systemLogsPage.set(1);
        this.systemLogsOffset.set(0);

        if (filter === 'source') {
            this.systemLogsSource.set(value.trim().toLowerCase() === 'all' ? '' : value.trim());
        } else if (filter === 'level') {
            this.systemLogsLevel.set(value.trim().toLowerCase() === 'debug' ? '' : value.trim().toLowerCase());
        }

        this.loadSystemLogsPage();
    }

    onSystemLogsSearchChange(keyword: string) {
        // Reset to first page when search changes
        this.systemLogsPage.set(1);
        this.systemLogsOffset.set(0);

        this.systemLogsKeyword.set(keyword);
        this.loadSystemLogsPage();
    }

    // Method to get available services from schedules
    private updateAvailableServices() {
        if (this.systemLogComponent && this.systemLogComponent.scheduleData) {
            const services = ['All', 'Storage'];
            this.systemLogComponent.scheduleData.forEach((schedule: any) => {
                if (schedule.name) {
                    services.push(schedule.name);
                }
            });
            this.availableServices.set(services);
        }
    }

    // Navigation methods for tiles
    navigateToAssets() {
        this.router.navigate(['/asset']);
    }

    navigateToSouth() {
        this.router.navigate(['/south']);
    }

    navigateToNorth() {
        this.router.navigate(['/north']);
    }

    private loadAlerts() {
        this.systemAlertService.getAlerts().pipe(
            takeUntil(this.destroy$)
        ).subscribe(
            (data: any) => {
                // The API returns { alerts: [...] } based on your example
                const alertsArray = data.alerts || [];
                this.systemAlerts.set(Array.isArray(alertsArray) ? alertsArray : []);
            },
            error => {
                console.error('Error loading alerts:', error);
                this.systemAlerts.set([]);
            }
        );
    }

    getAlertTime(timestamp: Date): string {
        if (!timestamp) return '';
        const now = new Date();
        const alertTime = new Date(timestamp);
        const diffInMinutes = Math.floor((now.getTime() - alertTime.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) {
            return 'just now';
        } else if (diffInMinutes < 60) {
            return `${diffInMinutes} min ago`;
        } else if (diffInMinutes < 1440) {
            const hours = Math.floor(diffInMinutes / 60);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else {
            const days = Math.floor(diffInMinutes / 1440);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        }
    }

    getAlertClass(urgency: string): string {
        switch (urgency?.toLowerCase()) {
            case 'critical':
                return 'has-text-danger';
            case 'high':
                return 'has-text-warning';
            case 'normal':
                return 'has-text-info';
            case 'low':
                return 'has-text-grey';
            default:
                return 'has-text-grey';
        }
    }

    // Alert hover functionality
    onAlertsHover() {
        // Clear any existing timeout
        if (this.alertsTooltipTimeout) {
            clearTimeout(this.alertsTooltipTimeout);
            this.alertsTooltipTimeout = undefined;
        }

        this.showAlertsTooltip.set(true);
        this.loadAlerts();
    }

    onAlertsLeave() {
        // Add a small delay before hiding the tooltip
        this.alertsTooltipTimeout = window.setTimeout(() => {
            this.showAlertsTooltip.set(false);
            this.alertsTooltipTimeout = undefined;
        }, 300);
    }
} 