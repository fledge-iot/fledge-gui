import { Injectable, NgZone, ChangeDetectorRef } from '@angular/core';
import { Subject } from 'rxjs';

export interface PerformanceThresholds {
    LARGE_DATASET_THRESHOLD: number;
    FORM_CREATION_THRESHOLD: number;
    DOM_OPERATION_THRESHOLD: number;
    PERFORMANCE_MODE_THRESHOLD: number;
    VIEW_SWITCHING_THRESHOLD: number;
    DELETION_OPTIMIZATION_THRESHOLD: number;
    VIRTUAL_SCROLL_THRESHOLD: number;
}

export interface PerformanceState {
    isLoadingLargeDataset: boolean;
    isViewSwitching: boolean;
    isLoadingInitialData: boolean;
    isExportingData: boolean;
    processingChunk: boolean;
    isLargeDataset: boolean;
    isVirtualScrollOptimized: boolean;
    visibleItemsBuffer: number;
    lastScrollTop: number;
    scrollDebounceTimer: any;
    isFileImportOperation: boolean;
    initialLoadDeferred: boolean;
    hasInitiallyLoaded: boolean;
    componentInitialized: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class PerformanceOptimizationService {

    // Default thresholds - same as in original components
    readonly DEFAULT_THRESHOLDS: PerformanceThresholds = {
        LARGE_DATASET_THRESHOLD: 100,
        FORM_CREATION_THRESHOLD: 200,
        DOM_OPERATION_THRESHOLD: 500,
        PERFORMANCE_MODE_THRESHOLD: 100,
        VIEW_SWITCHING_THRESHOLD: 300,
        DELETION_OPTIMIZATION_THRESHOLD: 400,
        VIRTUAL_SCROLL_THRESHOLD: 150
    };

    constructor(private zone: NgZone) { }

    createPerformanceState(): PerformanceState {
        return {
            isLoadingLargeDataset: false,
            isViewSwitching: false,
            isLoadingInitialData: false,
            isExportingData: false,
            processingChunk: false,
            isLargeDataset: false,
            isVirtualScrollOptimized: false,
            visibleItemsBuffer: 20,
            lastScrollTop: 0,
            scrollDebounceTimer: null,
            isFileImportOperation: false,
            initialLoadDeferred: false,
            hasInitiallyLoaded: false,
            componentInitialized: false
        };
    }

    shouldShowLoadingIndicator(itemCount: number, thresholds: PerformanceThresholds): boolean {
        return itemCount > 100; // Reduced from 200 to 100
    }

    shouldUseChunkedProcessing(itemCount: number, thresholds: PerformanceThresholds): boolean {
        return itemCount > 200; // Reduced from 1000
    }

    getChunkingParameters(itemCount: number): { chunkSize: number; delay: number } {
        if (itemCount > 10000) {
            return { chunkSize: 500, delay: 50 };
        } else if (itemCount > 5000) {
            return { chunkSize: 200, delay: 25 };
        } else {
            return { chunkSize: 100, delay: 10 };
        }
    }

    enablePostLoadOptimizations(
        itemCount: number,
        thresholds: PerformanceThresholds,
        callbacks: {
            enableChangeDetectionThrottling: () => void;
            optimizeViewportHandling: () => void;
            enableAggressiveMemoryManagement: () => void;
            setupScrollOptimization: () => void;
        }
    ): void {
        if (itemCount > 5000) {
            console.log(`Enabling post-load optimizations for ${itemCount} items`);
            callbacks.enableChangeDetectionThrottling();
            callbacks.optimizeViewportHandling();
            callbacks.enableAggressiveMemoryManagement();
            callbacks.setupScrollOptimization();
        }
    }

    progressiveReattachment(
        itemCount: number,
        startTime: number,
        cdRef: ChangeDetectorRef,
        callbacks: {
            emitLoadingComplete: () => void;
            enablePostLoadOptimizations: (itemCount: number) => void;
        }
    ): void {
        this.zone.runOutsideAngular(() => {
            requestAnimationFrame(() => {
                this.zone.run(() => {
                    cdRef.reattach();

                    setTimeout(() => {
                        cdRef.detectChanges();

                        const t1 = performance.now();
                        console.log(`Form creation took ${t1 - startTime} ms for ${itemCount} items (chunked processing with progressive reattachment)`);

                        if (itemCount >= 1000) {
                            callbacks.emitLoadingComplete();
                        }

                        callbacks.enablePostLoadOptimizations(itemCount);
                    }, 16); // ~60fps frame timing
                });
            });
        });
    }

    optimizedDOMOperation(operation: () => void, isLargeDataset: boolean): void {
        if (isLargeDataset) {
            this.zone.runOutsideAngular(() => {
                setTimeout(() => {
                    this.zone.run(operation);
                }, 0);
            });
        } else {
            operation();
        }
    }

    handleOptimizedScroll(
        performanceState: PerformanceState,
        cdRef: ChangeDetectorRef
    ): void {
        if (performanceState.scrollDebounceTimer) {
            clearTimeout(performanceState.scrollDebounceTimer);
        }

        performanceState.scrollDebounceTimer = setTimeout(() => {
            this.zone.runOutsideAngular(() => {
                setTimeout(() => {
                    this.zone.run(() => {
                        cdRef.markForCheck();
                    });
                }, 16);
            });
        }, 100);
    }

    handleScrollOptimization(
        viewport: any,
        performanceState: PerformanceState,
        cdRef: ChangeDetectorRef
    ): void {
        if (!viewport) return;

        const currentScrollTop = viewport.measureScrollOffset() || 0;

        if (Math.abs(currentScrollTop - performanceState.lastScrollTop) > 100) {
            performanceState.lastScrollTop = currentScrollTop;

            if (performanceState.scrollDebounceTimer) {
                clearTimeout(performanceState.scrollDebounceTimer);
            }

            performanceState.scrollDebounceTimer = setTimeout(() => {
                this.zone.run(() => {
                    cdRef.markForCheck();
                });
            }, 150);
        }
    }

    getOptimizedDebounceTime(isLargeDataset: boolean, itemCount: number): number {
        if (!isLargeDataset) return 300;
        return itemCount > 5000 ? 1200 : 800;
    }

    shouldNeedOptimization(itemCount: number, threshold: number): boolean {
        return itemCount > threshold;
    }

    cleanupScrollTimer(performanceState: PerformanceState): void {
        if (performanceState.scrollDebounceTimer) {
            clearTimeout(performanceState.scrollDebounceTimer);
            performanceState.scrollDebounceTimer = null;
        }
    }
} 