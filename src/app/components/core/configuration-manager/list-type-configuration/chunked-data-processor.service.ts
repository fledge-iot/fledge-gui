import { Injectable, NgZone, ChangeDetectorRef } from '@angular/core';
import { PerformanceOptimizationService, PerformanceState } from './performance-optimization.service';

export interface ChunkProcessingCallbacks<T> {
    processItem: (item: T, index: number) => void;
    onChunkComplete?: (processedCount: number, totalCount: number) => void;
    onProcessingComplete: (totalCount: number, startTime: number) => void;
    emitLoadingComplete: () => void;
    enablePostLoadOptimizations: (itemCount: number) => void;
}

export interface ChunkProcessingOptions {
    useRequestIdleCallback?: boolean;
    logProgress?: boolean;
    progressLogInterval?: number;
}

@Injectable({
    providedIn: 'root'
})
export class ChunkedDataProcessorService {

    constructor(
        private zone: NgZone,
        private performanceService: PerformanceOptimizationService
    ) { }

    processDataChunked<T>(
        data: T[],
        startTime: number,
        performanceState: PerformanceState,
        cdRef: ChangeDetectorRef,
        callbacks: ChunkProcessingCallbacks<T>,
        options: ChunkProcessingOptions = {}
    ): void {
        // Detach change detection for bulk operations
        cdRef.detach();
        performanceState.processingChunk = true;

        const { chunkSize, delay } = this.performanceService.getChunkingParameters(data.length);
        const logInterval = options.progressLogInterval || 5000;

        let currentIndex = 0;
        let processedCount = 0;

        const processChunk = () => {
            const endIndex = Math.min(currentIndex + chunkSize, data.length);

            // Use zone outside to prevent multiple change detection cycles
            this.zone.runOutsideAngular(() => {
                for (let i = currentIndex; i < endIndex; i++) {
                    this.zone.run(() => {
                        callbacks.processItem(data[i], i);
                        processedCount++;
                    });
                }
            });

            // Log progress at specified intervals
            if (options.logProgress && (processedCount % logInterval === 0 || endIndex === data.length)) {
                console.log(`📈 Chunk Progress: ${processedCount}/${data.length} items processed`);
            }

            // Callback for chunk completion
            if (callbacks.onChunkComplete) {
                callbacks.onChunkComplete(processedCount, data.length);
            }

            currentIndex = endIndex;

            if (currentIndex < data.length) {
                // Use optimized scheduling for form creation
                this.zone.runOutsideAngular(() => {
                    if (options.useRequestIdleCallback && 'requestIdleCallback' in window && data.length > 5000) {
                        // Use browser idle time for large datasets
                        requestIdleCallback(() => {
                            this.zone.run(() => processChunk());
                        }, { timeout: delay + 50 });
                    } else {
                        setTimeout(() => {
                            this.zone.run(() => processChunk());
                        }, delay);
                    }
                });
            } else {
                // Processing complete
                this.completeChunkedProcessing(
                    data.length,
                    startTime,
                    performanceState,
                    cdRef,
                    callbacks
                );
            }
        };

        // Start processing with a small initial delay to let UI settle
        setTimeout(() => processChunk(), 10);
    }

    private completeChunkedProcessing<T>(
        itemCount: number,
        startTime: number,
        performanceState: PerformanceState,
        cdRef: ChangeDetectorRef,
        callbacks: ChunkProcessingCallbacks<T>
    ): void {
        performanceState.processingChunk = false;
        performanceState.isLoadingLargeDataset = false;
        performanceState.isLoadingInitialData = false;
        performanceState.hasInitiallyLoaded = true;

        // For very large datasets, use progressive reattachment to prevent freezing
        if (itemCount > 5000) {
            this.performanceService.progressiveReattachment(
                itemCount,
                startTime,
                cdRef,
                {
                    emitLoadingComplete: callbacks.emitLoadingComplete,
                    enablePostLoadOptimizations: callbacks.enablePostLoadOptimizations
                }
            );
        } else {
            cdRef.reattach();
            cdRef.detectChanges();

            const t1 = performance.now();
            console.log(`Form creation took ${t1 - startTime} ms for ${itemCount} items (chunked processing)`);

            // Emit loading complete for file import operations OR for 1k+ initial data loading
            if (performanceState.isFileImportOperation || itemCount >= 1000) {
                callbacks.emitLoadingComplete();
            }

            if (itemCount > 5000) {
                callbacks.enablePostLoadOptimizations(itemCount);
            }
        }

        // Signal processing completion
        callbacks.onProcessingComplete(itemCount, startTime);
    }

    processNormalData<T>(
        data: T[],
        startTime: number,
        performanceState: PerformanceState,
        cdRef: ChangeDetectorRef,
        callbacks: ChunkProcessingCallbacks<T>
    ): void {
        console.log(`Using normal processing for ${data.length} items`);

        for (let i = 0; i < data.length; i++) {
            callbacks.processItem(data[i], i);
        }

        performanceState.hasInitiallyLoaded = true;
        cdRef.detectChanges();

        const t1 = performance.now();
        console.log(`Form creation took ${t1 - startTime} ms for ${data.length} items (normal processing)`);

        if (performanceState.isLoadingLargeDataset) {
            performanceState.isLoadingLargeDataset = false;
            callbacks.emitLoadingComplete();
            cdRef.detectChanges();
        }

        // Also clear initial data loading states
        if (performanceState.isLoadingInitialData) {
            performanceState.isLoadingInitialData = false;
            cdRef.detectChanges();
        }

        callbacks.onProcessingComplete(data.length, startTime);
    }

    shouldUseChunkedProcessing(dataLength: number): boolean {
        return this.performanceService.shouldUseChunkedProcessing(dataLength, this.performanceService.DEFAULT_THRESHOLDS);
    }

    shouldShowLoadingIndicator(dataLength: number): boolean {
        return this.performanceService.shouldShowLoadingIndicator(dataLength, this.performanceService.DEFAULT_THRESHOLDS);
    }
} 