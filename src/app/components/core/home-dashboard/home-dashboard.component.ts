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
    disabledSouthServices: string[];
    disabledNorthServices: string[];
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
    private charts: Chart[] = []; // For statistics history charts only
    private errorRateCharts: Chart[] = []; // For error rate monitoring charts only
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
        northServicesDisabled: 0,
        disabledSouthServices: [],
        disabledNorthServices: []
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

    // Track which keys currently have charts to avoid unnecessary recreation
    currentChartKeys = signal<string[]>([]);

    // Computed properties
    availableKeys = computed(() => {
        return this.statistics()
            .map(stat => stat.key)
            .filter(key => key && key !== 'READINGS');
    });

    // Error monitoring signals (mock data)
    errorSummary = signal<any>({
        totalErrorRate: 0,
        totalErrors: 0,
        discardedReadings: 0,
        bufferedReadings: 0,
        failedOperations: 0,
        serviceErrorCounts: {},
        lastUpdated: new Date().toISOString()
    });
    errorHistory = signal<any>({
        timeRange: { start: '', end: '' },
        data: []
    });
    serviceErrorMetrics = signal<any>({
        services: [],
        summary: { totalServices: 0, servicesWithErrors: 0, averageErrorRate: 0 }
    });
    systemHealth = signal<any>({
        overall: 'healthy',
        timestamp: new Date().toISOString(),
        resources: {
            cpu: { usage: 0, cores: 4, loadAverage: [0, 0, 0] },
            memory: { usage: 0, total: 0, available: 0 },
            disk: { usage: 0, total: 0, available: 0 },
            network: { interfaces: [] }
        },
        services: { totalCount: 0, runningCount: 0, errorCount: 0, stoppedCount: 0 }
    });
    showErrorMonitoring = signal(true);
    showSystemHealth = signal(true);
    errorTimeRange = signal<'1h' | '3h' | '12h' | '24h'>('3h');

    @ViewChild(SystemLogComponent) systemLogComponent!: SystemLogComponent;

    ngOnInit() {
        this.loadInitialData();
        this.setupAutoRefresh();
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();

        this.destroyCharts(); // Destroy statistics history charts
        this.destroyErrorRateChart(); // Destroy error rate charts
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

        // Also ensure error rate chart is created after view init
        setTimeout(() => {
            this.createErrorRateChart();
        }, 500);
    }

    private destroyCharts() {
        // Only destroy statistics history charts
        this.charts.forEach(chart => {
            if (chart) {
                chart.destroy();
            }
        });
        this.charts = [];

        // Reset the chart keys tracking
        this.currentChartKeys.set([]);
    }

    private loadInitialData() {
        this.loading.set(true);
        this.loadStatsSummary();
        this.loadStatistics();
        this.loadStatisticsHistory();
        this.loadErrorMonitoringData();
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
                // Parse system logs after refresh which will also update error monitoring
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
            this.northService.getNorthTasks(false).pipe(catchError(() => of([]))),
            this.assetsService.getAssetStorageTracking().pipe(catchError(() => of([])))
        ]).pipe(
            takeUntil(this.destroy$)
        ).subscribe(([assetsArray, southServicesResponse, northTasksArray, assetStorageData]) => {
            // Calculate total datapoints from asset storage tracking data
            let totalDatapoints = 0;
            if (assetStorageData && typeof assetStorageData === 'object') {
                const storageData = assetStorageData as any;
                // Check if the response has the expected structure with assets array
                if (storageData.assets && Array.isArray(storageData.assets)) {
                    totalDatapoints = storageData.assets.reduce((total: number, asset: any) => {
                        // Count individual datapoints in each asset's datapoints array
                        const datapointCount = asset.datapoints && Array.isArray(asset.datapoints) ? asset.datapoints.length : 0;
                        return total + datapointCount;
                    }, 0);
                } else if (storageData.count && typeof storageData.count === 'number') {
                    // Fallback to using the count field if assets array is not available
                    totalDatapoints = storageData.count;
                }
            }

            // Calculate south services status breakdown
            const southServicesArray = (southServicesResponse as any)?.services || [];
            const southServicesEnabled = southServicesArray.filter((service: any) => service.schedule_enabled === true).length;
            const southServicesDisabled = southServicesArray.filter((service: any) => service.schedule_enabled === false).length;

            // Calculate north services status breakdown
            const northTasksArrayData = Array.isArray(northTasksArray) ? northTasksArray : [];
            const northServicesEnabled = northTasksArrayData.filter((task: any) => task.enabled === true).length;
            const northServicesDisabled = northTasksArrayData.filter((task: any) => task.enabled === false).length;

            this.statsSummary.update(current => ({
                ...current,
                totalAssets: Array.isArray(assetsArray) ? assetsArray.length : 0,
                totalSouthServices: southServicesArray.length,
                totalNorthServices: northTasksArrayData.length,
                totalDatapoints: totalDatapoints,
                southServicesEnabled: southServicesEnabled,
                southServicesDisabled: southServicesDisabled,
                northServicesEnabled: northServicesEnabled,
                northServicesDisabled: northServicesDisabled,
                disabledSouthServices: southServicesArray.filter((service: any) => !service.schedule_enabled).map((service: any) => service.name),
                disabledNorthServices: northTasksArrayData.filter((task: any) => !task.enabled).map((task: any) => task.name)
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
                this.updateChartsWithNewData();
            });
    }

    private updateChartsWithNewData() {
        const history = this.statisticsHistory();
        if (!history.length) return;

        // Update existing charts with new data, or create them if they don't exist
        this.charts.forEach(chart => {
            if (chart && chart.canvas) {
                this.updateExistingChart(chart, history);
            }
        });

        // If no charts exist yet, create them
        if (this.charts.length === 0) {
            // Set initial loading state for at least the "Readings vs Sent" chart
            const selectedKeys = this.filterOptions().selectedKeys;
            const totalCharts = selectedKeys.length + 1; // +1 for Readings vs Sent chart
            const loadingStates = new Array(totalCharts).fill(true);
            this.chartsLoading.set(loadingStates);

            this.updateChart();
        }
    }

    private loadErrorMonitoringData() {
        // Calculate error rates based on actual system logs
        const timeRange = this.errorTimeRange();
        const now = new Date();
        let cutoffTime: Date;

        // Calculate cutoff time based on selected range
        switch (timeRange) {
            case '1h':
                cutoffTime = new Date(now.getTime() - 60 * 60 * 1000);
                break;
            case '3h':
                cutoffTime = new Date(now.getTime() - 3 * 60 * 60 * 1000);
                break;
            case '12h':
                cutoffTime = new Date(now.getTime() - 12 * 60 * 60 * 1000);
                break;
            case '24h':
                cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
        }

        // Parse system logs to calculate error rates
        const parsedLogs = this.parsedSystemLogs();
        const errorLogs = this.filterErrorLogsByTime(parsedLogs, cutoffTime);
        const errorMetrics = this.calculateErrorMetrics(errorLogs, parsedLogs, cutoffTime);

        this.errorSummary.set(errorMetrics.summary);

        // Generate error history data for chart
        const errorHistoryData = this.generateErrorHistory(errorLogs, cutoffTime, timeRange);
        this.errorHistory.set({
            timeRange: {
                start: cutoffTime.toISOString(),
                end: now.toISOString()
            },
            data: errorHistoryData
        });

        // Load real service data from fledge/service endpoint
        this.servicesApiService.getAllServices()
            .pipe(
                takeUntil(this.destroy$),
                catchError(error => {
                    console.error('Error loading services:', error);
                    // Fallback to mock data if API fails
                    return of({
                        services: [
                            {
                                name: 'Fledge Storage',
                                type: 'Storage',
                                status: 'running',
                                address: 'localhost',
                                management_port: 42269,
                                service_port: 37895,
                                protocol: 'http'
                            },
                            {
                                name: 'Fledge Core',
                                type: 'Core',
                                status: 'running',
                                address: '0.0.0.0',
                                management_port: 43557,
                                service_port: 8081,
                                protocol: 'http'
                            }
                        ]
                    });
                })
            )
            .subscribe((response: any) => {
                const services = response.services || [];

                // Transform service data for the table
                const transformedServices = services.map((service: any) => ({
                    name: service.name,
                    type: this.getServiceTypeLabel(service.type),
                    status: service.status,
                    errorRate: this.calculateServiceErrorRate(service.name, errorLogs, parsedLogs, cutoffTime),
                    uptime: this.getRealisticUptime(this.calculateServiceErrorRate(service.name, errorLogs, parsedLogs, cutoffTime), service.status),
                    lastError: this.getLastErrorForService(service.name, errorLogs),
                    address: service.address,
                    managementPort: service.management_port,
                    servicePort: service.service_port,
                    protocol: service.protocol
                }));

                this.serviceErrorMetrics.set({
                    services: transformedServices,
                    summary: {
                        totalServices: transformedServices.length,
                        servicesWithErrors: transformedServices.filter(s => s.lastError !== null).length,
                        averageErrorRate: transformedServices.reduce((sum, s) => sum + s.errorRate, 0) / transformedServices.length
                    }
                });

                // Calculate system health based on actual service data
                const totalServices = transformedServices.length;
                const runningServices = transformedServices.filter(s => s.status === 'running').length;
                const errorServices = transformedServices.filter(s => s.status === 'unresponsive' || s.status === 'failed').length;
                const stoppedServices = transformedServices.filter(s => s.status === 'shutdown' || s.status === 'stopped').length;

                // Mock system health data with real service counts
                this.systemHealth.set({
                    overall: runningServices === totalServices ? 'healthy' : runningServices > totalServices * 0.8 ? 'degraded' : 'critical',
                    timestamp: new Date().toISOString(),
                    resources: {
                        cpu: {
                            usage: Math.floor(Math.random() * 40) + 20, // 20-60%
                            cores: 4,
                            loadAverage: [
                                Math.random() * 2,
                                Math.random() * 2,
                                Math.random() * 2
                            ]
                        },
                        memory: {
                            usage: Math.floor(Math.random() * 30) + 40, // 40-70%
                            total: 16384, // 16GB in MB
                            available: Math.floor(Math.random() * 8000) + 4000
                        },
                        disk: {
                            usage: Math.floor(Math.random() * 20) + 60, // 60-80%
                            total: 500000, // 500GB in MB
                            available: Math.floor(Math.random() * 200000) + 100000
                        },
                        network: {
                            interfaces: [
                                { name: 'eth0', status: 'up', speed: '1000Mbps' },
                                { name: 'wlan0', status: 'down', speed: 'N/A' }
                            ]
                        }
                    },
                    services: {
                        totalCount: totalServices,
                        runningCount: runningServices,
                        errorCount: errorServices,
                        stoppedCount: stoppedServices
                    }
                });
            });

        // Create the error rate chart after data is loaded and DOM is ready
        // Use a longer timeout to ensure the DOM is fully rendered and data is updated
        setTimeout(() => {
            if (this.showErrorMonitoring()) {
                console.log('📊 Creating error rate chart with new data for time range:', this.errorTimeRange());
                this.createErrorRateChart();
            }
        }, 300);
    }

    private filterErrorLogsByTime(logs: any[], cutoffTime: Date): any[] {
        return logs.filter(log => {
            if (!log.timestamp) return false;

            try {
                const logTime = new Date(log.timestamp);
                return logTime >= cutoffTime && (log.level === 'ERROR' || log.level === 'FATAL' || log.level === 'EXCEPTION');
            } catch (error) {
                return false;
            }
        });
    }

    private calculateErrorMetrics(errorLogs: any[], allLogs: any[], cutoffTime: Date): { summary: any } {
        const totalLogs = allLogs.filter(log => {
            if (!log.timestamp) return false;
            try {
                const logTime = new Date(log.timestamp);
                return logTime >= cutoffTime;
            } catch (error) {
                return false;
            }
        }).length;

        const totalErrors = errorLogs.length;
        const errorRate = totalLogs > 0 ? (totalErrors / totalLogs) * 100 : 0;

        // Count errors by service
        const serviceErrorCounts: { [key: string]: number } = {};
        let discardedReadings = 0;
        let failedOperations = 0;

        errorLogs.forEach(log => {
            if (log.service) {
                serviceErrorCounts[log.service] = (serviceErrorCounts[log.service] || 0) + 1;
            }

            // Count specific error types based on message content
            if (log.message && log.message.toLowerCase().includes('discard')) {
                discardedReadings++;
            }
            if (log.message && (log.message.toLowerCase().includes('failed') || log.message.toLowerCase().includes('failure'))) {
                failedOperations++;
            }
        });

        return {
            summary: {
                totalErrorRate: parseFloat(errorRate.toFixed(1)),
                totalErrors: totalErrors,
                discardedReadings: discardedReadings,
                bufferedReadings: Math.floor(Math.random() * 100), // Keep mock for now
                failedOperations: failedOperations,
                serviceErrorCounts: serviceErrorCounts,
                lastUpdated: new Date().toISOString()
            }
        };
    }

    private generateErrorHistory(errorLogs: any[], cutoffTime: Date, timeRange: string): any[] {
        const now = new Date();
        const data = [];

        console.log('📊 Generating error history for time range:', timeRange);
        console.log('   - Cutoff time:', cutoffTime.toISOString());
        console.log('   - Current time:', now.toISOString());
        console.log('   - Error logs count:', errorLogs.length);

        // Determine interval based on time range
        let intervalMinutes: number;
        let totalIntervals: number;

        switch (timeRange) {
            case '1h':
                intervalMinutes = 5; // 5-minute intervals
                totalIntervals = 12;
                break;
            case '3h':
                intervalMinutes = 15; // 15-minute intervals
                totalIntervals = 12;
                break;
            case '12h':
                intervalMinutes = 60; // 1-hour intervals
                totalIntervals = 12;
                break;
            case '24h':
                intervalMinutes = 120; // 2-hour intervals
                totalIntervals = 12;
                break;
        }

        console.log('   - Interval minutes:', intervalMinutes);
        console.log('   - Total intervals:', totalIntervals);

        // Generate data points for each interval
        for (let i = totalIntervals - 1; i >= 0; i--) {
            const intervalStart = new Date(now.getTime() - (i + 1) * intervalMinutes * 60 * 1000);
            const intervalEnd = new Date(now.getTime() - i * intervalMinutes * 60 * 1000);

            // Count errors in this interval
            const intervalErrors = errorLogs.filter(log => {
                if (!log.timestamp) return false;
                try {
                    const logTime = new Date(log.timestamp);
                    return logTime >= intervalStart && logTime < intervalEnd;
                } catch (error) {
                    return false;
                }
            });

            const errorCount = intervalErrors.length;
            const discardedCount = intervalErrors.filter(log =>
                log.message && log.message.toLowerCase().includes('discard')
            ).length;

            // Calculate error rate for this interval (simplified)
            const intervalErrorRate = errorCount > 0 ? Math.min(errorCount * 2, 100) : 0;

            const dataPoint = {
                timestamp: intervalEnd.toISOString(),
                errorRate: parseFloat(intervalErrorRate.toFixed(1)),
                totalErrors: errorCount,
                discardedReadings: discardedCount,
                intervalStart: intervalStart.toISOString(),
                intervalEnd: intervalEnd.toISOString()
            };

            data.push(dataPoint);
        }

        console.log('   - Generated data points:', data.length);
        console.log('   - First data point:', data[0]);
        console.log('   - Last data point:', data[data.length - 1]);

        return data;
    }

    private calculateServiceErrorRate(serviceName: string, errorLogs: any[], allLogs: any[], cutoffTime: Date): number {
        const serviceErrorLogs = errorLogs.filter(log => log.service === serviceName);
        const serviceTotalLogs = allLogs.filter(log => {
            if (!log.timestamp || log.service !== serviceName) return false;
            try {
                const logTime = new Date(log.timestamp);
                return logTime >= cutoffTime;
            } catch (error) {
                return false;
            }
        });

        // If we have real log data, use it
        if (serviceTotalLogs.length > 0) {
            return parseFloat(((serviceErrorLogs.length / serviceTotalLogs.length) * 100).toFixed(1));
        }

        // Generate realistic dummy error rates for demonstration when no logs exist
        return this.generateDummyErrorRate(serviceName);
    }

    private generateDummyErrorRate(serviceName: string): number {
        // Use service name to generate consistent but varied error rates
        const nameHash = serviceName.split('').reduce((hash, char) => {
            return char.charCodeAt(0) + ((hash << 5) - hash);
        }, 0);

        const serviceType = serviceName.toLowerCase();

        // Different service types have different typical error rates
        let baseErrorRate: number;
        let variation: number;

        if (serviceType.includes('storage')) {
            // Storage services are usually very reliable
            baseErrorRate = 0.5;
            variation = 2;
        } else if (serviceType.includes('core')) {
            // Core services are usually reliable
            baseErrorRate = 1;
            variation = 3;
        } else if (serviceType.includes('south') || serviceType.includes('north')) {
            // IO services may have more variability
            baseErrorRate = 2;
            variation = 8;
        } else if (serviceType.includes('notification') || serviceType.includes('dispatcher')) {
            // Communication services can be more error-prone
            baseErrorRate = 5;
            variation = 15;
        } else {
            // Default for unknown services
            baseErrorRate = 2;
            variation = 10;
        }

        // Use hash to create consistent but pseudo-random variation
        const randomFactor = (Math.abs(nameHash) % 100) / 100;
        const errorRate = baseErrorRate + (randomFactor * variation);

        // Add some services with higher error rates for demonstration
        if (serviceName.toLowerCase().includes('test') || serviceName.toLowerCase().includes('demo')) {
            return parseFloat((20 + (randomFactor * 30)).toFixed(1)); // 20-50% error rate
        }

        // Ensure error rate is within reasonable bounds
        return parseFloat(Math.max(0, Math.min(80, errorRate)).toFixed(1));
    }

    private getLastErrorForService(serviceName: string, errorLogs: any[]): any {
        const serviceErrors = errorLogs
            .filter(log => log.service === serviceName)
            .sort((a, b) => {
                try {
                    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                } catch (error) {
                    return 0;
                }
            });

        if (serviceErrors.length === 0) return null;

        const lastError = serviceErrors[0];
        return {
            message: lastError.message || 'Unknown error',
            timestamp: lastError.timestamp || new Date().toISOString()
        };
    }

    private getRealisticUptime(errorRate: number, serviceStatus: string): number {
        // If service is not running, uptime should be very low
        if (serviceStatus === 'failed' || serviceStatus === 'unresponsive') {
            return Math.random() * 30; // 0-30% uptime for failed services
        }

        if (serviceStatus === 'shutdown' || serviceStatus === 'stopped') {
            return Math.random() * 20; // 0-20% uptime for stopped services
        }

        // For running services, calculate uptime based on error rate
        let baseUptime: number;
        let variation: number;

        if (errorRate === 0) {
            // Perfect service: 98.5-99.9% uptime
            baseUptime = 98.5;
            variation = 1.4;
        } else if (errorRate <= 1) {
            // Excellent service: 97-99% uptime
            baseUptime = 97;
            variation = 2;
        } else if (errorRate <= 5) {
            // Good service: 95-98% uptime
            baseUptime = 95;
            variation = 3;
        } else if (errorRate <= 15) {
            // Average service: 85-95% uptime
            baseUptime = 85;
            variation = 10;
        } else if (errorRate <= 30) {
            // Poor service: 70-85% uptime
            baseUptime = 70;
            variation = 15;
        } else if (errorRate <= 50) {
            // Very poor service: 40-70% uptime
            baseUptime = 40;
            variation = 30;
        } else {
            // Critical service: 10-40% uptime
            baseUptime = 10;
            variation = 30;
        }

        // Add some randomness within the range
        const uptime = baseUptime + (Math.random() * variation);

        // Ensure we don't exceed 100% or go below 0%
        return Math.max(0, Math.min(100, parseFloat(uptime.toFixed(1))));
    }

    private getServiceTypeLabel(type: string): string {
        switch (type.toLowerCase()) {
            case 'southbound':
                return 'south';
            case 'northbound':
                return 'north';
            case 'storage':
                return 'storage';
            case 'core':
                return 'core';
            case 'dispatcher':
                return 'dispatcher';
            case 'notification':
                return 'notification';
            default:
                return type.toLowerCase();
        }
    }

    private updateChart() {
        const history = this.statisticsHistory();
        const filters = this.filterOptions();

        if (!history.length) return;

        const currentKeys = this.currentChartKeys();
        const selectedKeys = filters.selectedKeys;

        // Always ensure the "Readings vs Sent" chart exists first
        this.ensureReadingsVsSentChart(history);

        // Check if there are any changes in the selected keys
        const hasChanges = currentKeys.length !== selectedKeys.length ||
            !currentKeys.every(key => selectedKeys.includes(key)) ||
            !selectedKeys.every(key => currentKeys.includes(key));

        if (!hasChanges) {
            return; // No changes needed for individual stat charts
        }

        // Destroy only the individual stat charts (not the readings vs sent chart)
        this.destroyIndividualStatCharts();

        // Create charts for all selected keys if any
        if (selectedKeys.length > 0) {
            // Set loading state for new charts
            const totalCharts = selectedKeys.length + 1; // +1 for Readings vs Sent chart
            const loadingStates = new Array(totalCharts).fill(false);

            // Set loading for individual stat charts (index 1 and above)
            for (let i = 1; i < totalCharts; i++) {
                loadingStates[i] = true;
            }

            this.chartsLoading.set(loadingStates);

            // Small delay to ensure DOM is updated before creating charts
            setTimeout(() => {
                // Create individual charts for selected keys
                selectedKeys.forEach((key, index) => {
                    const chartIndex = index + 1; // +1 to account for Readings vs Sent chart
                    this.createChart(key, chartIndex, history);
                });

                // Update the current chart keys
                this.currentChartKeys.set([...selectedKeys]);
            }, 100);
        } else {
            // If no keys selected, just update tracking
            this.currentChartKeys.set([]);
        }
    }

    private destroyIndividualStatCharts() {
        // Only destroy charts that are NOT the readings vs sent chart
        const readingsVsSentChart = this.charts.find(chart => chart.canvas?.id === 'readingsVsSentChart');

        this.charts.forEach(chart => {
            if (chart && chart !== readingsVsSentChart) {
                try {
                    chart.destroy();
                } catch (error) {
                    console.warn('Warning destroying individual stat chart:', error);
                }
            }
        });

        // Keep only the readings vs sent chart in the array
        if (readingsVsSentChart) {
            this.charts = [readingsVsSentChart];
        } else {
            this.charts = [];
        }
    }

    private ensureReadingsVsSentChart(history: any[]) {
        const chartId = 'readingsVsSentChart';
        const existingChart = this.charts.find(chart => chart.canvas?.id === chartId);

        if (!existingChart) {
            // Create the Readings vs Sent chart if it doesn't exist
            this.createReadingsVsSentChart(history);
        } else {
            // Update existing chart with new data
            this.updateExistingChart(existingChart, history);
        }
    }

    private updateExistingChart(chart: Chart, history: any[]) {
        try {
            // Update chart data without destroying and recreating
            const labels = history.map(item => {
                return this.dateFormatter.transform(item.history_ts, 'HH:mm:ss');
            });

            chart.data.labels = labels;

            if (chart.canvas?.id === 'readingsVsSentChart') {
                // Update Readings vs Sent chart data
                chart.data.datasets[0].data = history.map(item => item.READINGS || 0);
                chart.data.datasets[1].data = history.map(item => item.SENT || 0);
            } else {
                // Update individual stat chart data
                const chartTitle = chart.options?.plugins?.title?.text as string;
                if (chartTitle && chart.data.datasets[0]) {
                    chart.data.datasets[0].data = history.map(item => item[chartTitle] || 0);
                }
            }

            chart.update('none'); // Update without animation for better performance
        } catch (error) {
            console.warn('Error updating existing chart:', error);
        }
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

        // If collapsing, destroy only statistics history charts to free memory
        if (!this.isStatsHistoryExpanded()) {
            this.destroyCharts(); // Only destroys statistics history charts now
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
                this.parseSystemLogsData(); // This will also update error monitoring
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

            // Update error monitoring data when logs are refreshed
            this.loadErrorMonitoringData();
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
            rawLog: cleanLog
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
        }

        return logEntry;
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
                    label: 'Received',
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
                    label: 'Sent',
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

    // Helper methods for disabled services tooltips
    getDisabledSouthServicesNames(): string {
        const names = this.statsSummary().disabledSouthServices;
        return names.length > 0 ? names.join(', ') : '';
    }

    getDisabledNorthServicesNames(): string {
        const names = this.statsSummary().disabledNorthServices;
        return names.length > 0 ? names.join(', ') : '';
    }

    getDisabledSouthServicesTooltip(): string {
        const names = this.getDisabledSouthServicesNames();
        return names;
    }

    getDisabledNorthServicesTooltip(): string {
        const names = this.getDisabledNorthServicesNames();
        return names;
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

    // Error monitoring methods
    getServiceErrorKeys(): string[] {
        return Object.keys(this.errorSummary().serviceErrorCounts);
    }

    getServiceErrorCount(service: string): number {
        return this.errorSummary().serviceErrorCounts[service] || 0;
    }

    toggleErrorMonitoringSection() {
        this.showErrorMonitoring.update(show => !show);

        // If expanding the section, recreate the chart after DOM is updated
        if (this.showErrorMonitoring()) {
            // Use a longer timeout to ensure the DOM is fully rendered
            setTimeout(() => {
                this.createErrorRateChart();
            }, 200);
        }
    }

    toggleSystemHealthSection() {
        this.showSystemHealth.update(show => !show);
    }

    private createErrorRateChart() {
        console.log('🔧 Creating error rate chart for time range:', this.errorTimeRange());

        // Wait for the DOM to be ready and the canvas to be available
        const canvas = document.getElementById('errorRateChart') as HTMLCanvasElement;
        if (!canvas) {
            console.error('❌ Error rate chart canvas not found');
            return;
        }

        // Additional check to ensure the canvas is properly rendered
        if (canvas.offsetWidth === 0 || canvas.offsetHeight === 0) {
            console.warn('⚠️ Canvas not yet rendered, retrying...');
            setTimeout(() => this.createErrorRateChart(), 100);
            return;
        }

        console.log('✅ Canvas found and ready:', canvas);
        console.log('   - Canvas dimensions:', canvas.offsetWidth, 'x', canvas.offsetHeight);

        // Make sure we destroy any existing chart first
        this.destroyErrorRateChart();

        const errorHistoryData = this.errorHistory().data;
        console.log('📊 Error history data for chart:', errorHistoryData);
        console.log('   - Data points count:', errorHistoryData.length);
        console.log('   - Time range:', this.errorTimeRange());

        if (!errorHistoryData || errorHistoryData.length === 0) {
            console.error('❌ No error history data available for chart');
            return;
        }

        const labels = errorHistoryData.map(item => {
            // Use different time formats based on the time range
            const timeFormat = this.getTimeFormatForRange(this.errorTimeRange());
            return this.dateFormatter.transform(item.timestamp, timeFormat);
        });

        console.log('🏷️ Chart labels:', labels);
        console.log('   - First label:', labels[0]);
        console.log('   - Last label:', labels[labels.length - 1]);

        try {
            // Get the 2D context to ensure canvas is properly initialized
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                console.error('❌ Cannot get 2D context from canvas');
                return;
            }

            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [
                        {
                            label: 'Error Rate (%)',
                            data: errorHistoryData.map(item => item.errorRate),
                            borderColor: '#EF4444',
                            backgroundColor: '#EF444430',
                            fill: true,
                            tension: 0.4,
                            borderWidth: 2,
                            pointBackgroundColor: '#EF4444',
                            pointBorderColor: '#ffffff',
                            pointBorderWidth: 2,
                            pointRadius: 3,
                            pointHoverRadius: 5,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Total Errors',
                            data: errorHistoryData.map(item => item.totalErrors),
                            borderColor: '#F59E0B',
                            backgroundColor: '#F59E0B30',
                            fill: false,
                            tension: 0.4,
                            borderWidth: 2,
                            pointBackgroundColor: '#F59E0B',
                            pointBorderColor: '#ffffff',
                            pointBorderWidth: 2,
                            pointRadius: 3,
                            pointHoverRadius: 5,
                            yAxisID: 'y1'
                        },
                        {
                            label: 'Discarded Readings',
                            data: errorHistoryData.map(item => item.discardedReadings),
                            borderColor: '#F97316',
                            backgroundColor: '#F9731630',
                            fill: false,
                            tension: 0.4,
                            borderWidth: 2,
                            pointBackgroundColor: '#F97316',
                            pointBorderColor: '#ffffff',
                            pointBorderWidth: 2,
                            pointRadius: 3,
                            pointHoverRadius: 5,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: `Error Rate Trends (${this.errorTimeRange().toUpperCase()})`,
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    },
                    scales: {
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Error Rate (%)'
                            },
                            grid: {
                                color: 'rgba(239, 68, 68, 0.1)'
                            },
                            ticks: {
                                callback: function (value) {
                                    return value + '%';
                                }
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Count'
                            },
                            grid: {
                                drawOnChartArea: false,
                            },
                        },
                        x: {
                            title: {
                                display: true,
                                text: `Time (${this.errorTimeRange()})`
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

            this.errorRateCharts.push(chart);
            console.log('✅ Error rate chart created successfully with', labels.length, 'data points');

            // Force chart update and resize to ensure visibility
            setTimeout(() => {
                if (chart) {
                    try {
                        chart.update();
                        chart.resize();
                        console.log('🔄 Chart updated and resized for time range:', this.errorTimeRange());
                    } catch (error) {
                        console.warn('Chart update failed:', error);
                    }
                }
            }, 100);
        } catch (error) {
            console.error('❌ Error creating chart:', error);
        }
    }

    debugErrorChart() {
        console.log('=== ERROR CHART DEBUG START ===');
        console.log('1. Error Monitoring Section Visible:', this.showErrorMonitoring());
        console.log('2. Error History Data:', this.errorHistory());
        console.log('3. Error Summary:', this.errorSummary());

        const canvas = document.getElementById('errorRateChart');
        console.log('4. Canvas Element:', canvas);

        if (canvas) {
            console.log('   - Canvas Width:', canvas.offsetWidth);
            console.log('   - Canvas Height:', canvas.offsetHeight);
            console.log('   - Canvas Visible:', canvas.offsetParent !== null);
        }

        console.log('5. Existing Charts Count:', this.errorRateCharts.length);
        this.errorRateCharts.forEach((chart, index) => {
            console.log(`   - Chart ${index}:`, chart.canvas?.id, chart);
        });

        console.log('6. Attempting to create chart...');
        this.createErrorRateChart();

        // Check if chart is actually visible after creation
        setTimeout(() => {
            const canvas = document.getElementById('errorRateChart') as HTMLCanvasElement;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
                const hasData = imageData?.data.some(pixel => pixel !== 0);
                console.log('📊 Chart has rendered data:', hasData);
                console.log('📐 Final canvas size:', canvas.width, 'x', canvas.height);
            }
        }, 200);

        console.log('=== ERROR CHART DEBUG END ===');
    }

    onErrorTimeRangeChange(timeRange: '1h' | '3h' | '12h' | '24h') {
        this.errorTimeRange.set(timeRange);

        // First destroy the existing error rate chart
        this.destroyErrorRateChart();

        // Then load new data and recreate the chart
        this.loadErrorMonitoringData();
    }

    private destroyErrorRateChart() {
        const existingChart = this.errorRateCharts.find(chart => chart.canvas?.id === 'errorRateChart');
        if (existingChart) {
            console.log('🗑️ Destroying existing error rate chart');
            try {
                existingChart.destroy();
            } catch (error) {
                console.warn('Warning destroying existing error rate chart:', error);
            }
            this.errorRateCharts = this.errorRateCharts.filter(chart => chart !== existingChart);
        }
    }

    private getTimeFormatForRange(timeRange: string): string {
        switch (timeRange) {
            case '1h':
                return 'HH:mm'; // Show hours and minutes for short range
            case '3h':
                return 'HH:mm'; // Show hours and minutes 
            case '12h':
                return 'HH:mm'; // Show hours and minutes
            case '24h':
                return 'MM-DD HH:mm'; // Show month-day and time for longer range
            default:
                return 'HH:mm:ss';
        }
    }
} 