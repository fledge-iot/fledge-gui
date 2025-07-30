import { Injectable, NgZone, ChangeDetectorRef } from '@angular/core';
import { FormArray, AbstractControl } from '@angular/forms';
import { PerformanceOptimizationService, PerformanceState, PerformanceThresholds } from './performance-optimization.service';

export interface FormManagementCallbacks {
    refreshControlsCache: () => void;
    setChildConfigFormValidity: () => void;
    formStatusEvent: (status: any) => void;
}

@Injectable({
    providedIn: 'root'
})
export class FormManagementService {

    constructor(
        private zone: NgZone,
        private performanceService: PerformanceOptimizationService
    ) { }

    addListItemOptimized<T>(
        formArray: FormArray,
        createItemFn: () => T,
        isPrepend: boolean,
        performanceState: PerformanceState,
        cdRef: ChangeDetectorRef,
        callbacks: FormManagementCallbacks,
        group: string
    ): void {
        // Highly optimized add for very large datasets
        this.zone.runOutsideAngular(() => {
            // Perform operations outside Angular zone
            if (isPrepend) {
                formArray.insert(0, createItemFn());
            } else {
                formArray.push(createItemFn());
            }

            this.zone.run(() => {
                // Batch status emission
                callbacks.formStatusEvent({ status: formArray.valid, group });

                // Refresh cached controls
                callbacks.refreshControlsCache();

                // Minimal change detection
                cdRef.markForCheck();
            });
        });
    }

    removeListItemOptimized(
        formArray: FormArray,
        index: number,
        initialProperties: any[],
        items: any[],
        performanceState: PerformanceState,
        thresholds: PerformanceThresholds,
        cdRef: ChangeDetectorRef,
        callbacks: FormManagementCallbacks
    ): void {
        const needsOptimization = formArray.length > thresholds.DELETION_OPTIMIZATION_THRESHOLD;

        if (needsOptimization) {
            // For very large datasets, completely detach and use zone outside
            cdRef.detach();

            this.zone.runOutsideAngular(() => {
                // Perform deletion operations outside Angular zone
                formArray.removeAt(index);
                initialProperties.splice(index, 1);
                items.splice(index, 1);

                this.zone.run(() => {
                    callbacks.setChildConfigFormValidity();

                    // Refresh cached controls after removing item
                    callbacks.refreshControlsCache();

                    // Use longer delay for very large datasets to prevent UI blocking
                    setTimeout(() => {
                        cdRef.reattach();
                        cdRef.detectChanges();
                    }, formArray.length > 15000 ? 200 : 100);
                });
            });
        } else if (performanceState.isLargeDataset && formArray.length > 5000) {
            // Medium optimization for moderately large datasets
            cdRef.detach();

            formArray.removeAt(index);
            initialProperties.splice(index, 1);
            items.splice(index, 1);
            callbacks.setChildConfigFormValidity();

            // Refresh cached controls after removing item
            callbacks.refreshControlsCache();

            this.zone.runOutsideAngular(() => {
                setTimeout(() => {
                    this.zone.run(() => {
                        cdRef.reattach();
                        cdRef.detectChanges();
                    });
                }, 50);
            });
        } else {
            // Normal processing for smaller datasets
            formArray.removeAt(index);
            initialProperties.splice(index, 1);
            items.splice(index, 1);
            callbacks.setChildConfigFormValidity();

            // Refresh cached controls after removing item
            callbacks.refreshControlsCache();

            cdRef.detectChanges();
        }
    }

    handleFormStatusUpdate(
        formState: any,
        index: number,
        items: any[],
        performanceState: PerformanceState,
        formArray: FormArray,
        callbacks: FormManagementCallbacks
    ): void {
        // Only optimize form status updates for very large datasets
        if (performanceState.isLargeDataset && formArray.length > 3000) {
            this.zone.runOutsideAngular(() => {
                items[index].status = formState.status;
                this.zone.run(() => {
                    callbacks.setChildConfigFormValidity();
                    callbacks.formStatusEvent(formState);
                });
            });
        } else {
            items[index].status = formState.status;
            callbacks.setChildConfigFormValidity();
            callbacks.formStatusEvent(formState);
        }
    }

    createControlsCache<T extends AbstractControl>(controls: T[]): T[] {
        return [...controls];
    }

    trackByIndex(index: number, _item: any): number {
        return index;
    }

    trackByFormControl(index: number, item: any, isLargeDataset: boolean): any {
        return isLargeDataset ? index : item;
    }

    setChildConfigFormValidity(items: any[]): boolean {
        return !items.find(value => value.status === false);
    }

    handleAddItemViewOperations(
        formArray: FormArray,
        isPrepend: boolean,
        isListView: boolean,
        configuration: any,
        from: string,
        scrollToRowFn: (index: number) => void,
        expandListItemFn: (index: number) => void,
        performanceState: PerformanceState,
        thresholds: PerformanceThresholds,
        cdRef: ChangeDetectorRef,
        viewport?: any
    ): void {
        if (configuration.items === 'object') {
            const index = isPrepend ? 0 : formArray.length - 1;
            if (isListView) {
                scrollToRowFn(index);
            } else {
                expandListItemFn(index);
            }
        }

        // Handle viewport scrolling for large datasets
        if (performanceState.isLargeDataset && formArray.length > 3000) {
            this.zone.runOutsideAngular(() => {
                setTimeout(() => {
                    this.zone.run(() => {
                        cdRef.reattach();
                        cdRef.detectChanges();
                    });
                }, 0);
            });
        } else {
            cdRef.detectChanges();

            if (viewport) {
                this.zone.runOutsideAngular(() => {
                    requestAnimationFrame(() => {
                        viewport.checkViewportSize();
                        setTimeout(() => {
                            viewport.scrollToIndex(formArray.length - 1, 'smooth');
                        }, 0);
                    });
                });
            }
        }
    }

    validateListSize(formArray: FormArray, configuration: any): boolean {
        const controlsLength = formArray.length;
        const listSize = configuration?.listSize > 0 ? +configuration.listSize : 9999;
        return controlsLength <= listSize;
    }
} 