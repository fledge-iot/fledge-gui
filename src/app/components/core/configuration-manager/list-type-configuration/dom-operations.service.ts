import { Injectable, NgZone } from '@angular/core';
import { PerformanceOptimizationService, PerformanceThresholds } from './performance-optimization.service';

@Injectable({
    providedIn: 'root'
})
export class DomOperationsService {

    constructor(
        private zone: NgZone,
        private performanceService: PerformanceOptimizationService
    ) { }

    expandCollapseSingleItem(
        configurationKey: string,
        index: number,
        isExpand: boolean,
        from: string,
        scrollIntoView = false,
        isLargeDataset = false
    ): void {
        this.performanceService.optimizedDOMOperation(() => {
            const cardHeader = document.getElementById(`card-header-${configurationKey}-${index}-${from}`);
            const cardBody = document.getElementById(`card-content-${configurationKey}-${index}-${from}`);

            if (!cardHeader || !cardBody) {
                return; // Silently skip if elements don't exist
            }

            if (isExpand) {
                cardHeader.classList.add('is-hidden');
                cardBody.classList.remove('is-hidden');
                if (scrollIntoView) {
                    const input: HTMLElement = cardBody.querySelector('.input.is-small');
                    if (input) {
                        input.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        input.focus();
                    }
                }
            } else {
                cardHeader.classList.remove('is-hidden');
                cardBody.classList.add('is-hidden');
            }
        }, isLargeDataset);
    }

    scrollToRow(configurationKey: string, index: number, from: string): void {
        setTimeout(() => {
            const row = document.getElementById(`table-row-${configurationKey}-${index}-${from}`);
            if (row) {
                const input: HTMLElement = row.querySelector('.input.is-small');
                if (input) {
                    input.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    input.focus();
                }
            }
        }, 1);
    }

    expandAllItems(
        itemCount: number,
        configurationKey: string,
        from: string,
        thresholds: PerformanceThresholds,
        isLargeDataset: boolean
    ): void {
        if (itemCount > thresholds.DOM_OPERATION_THRESHOLD) {
            this.expandAllItemsChunked(itemCount, configurationKey, from);
        } else {
            for (let i = 0; i < itemCount; i++) {
                this.expandCollapseSingleItem(configurationKey, i, true, from, false, isLargeDataset);
            }
        }
    }

    collapseAllItems(
        itemCount: number,
        configurationKey: string,
        from: string,
        thresholds: PerformanceThresholds,
        isLargeDataset: boolean
    ): void {
        if (itemCount > thresholds.DOM_OPERATION_THRESHOLD) {
            this.collapseAllItemsChunked(itemCount, configurationKey, from);
        } else {
            for (let i = 0; i < itemCount; i++) {
                this.expandCollapseSingleItem(configurationKey, i, false, from, false, isLargeDataset);
            }
        }
    }

    private expandAllItemsChunked(itemCount: number, configurationKey: string, from: string): void {
        const chunkSize = 100; // Larger chunks for DOM operations (much faster than form creation)
        let currentIndex = 0;

        const processChunk = () => {
            const endIndex = Math.min(currentIndex + chunkSize, itemCount);

            for (let i = currentIndex; i < endIndex; i++) {
                this.expandCollapseSingleItem(configurationKey, i, true, from);
            }

            currentIndex = endIndex;

            if (currentIndex < itemCount) {
                this.zone.runOutsideAngular(() => {
                    setTimeout(() => {
                        this.zone.run(() => processChunk());
                    }, 5); // Much shorter delay for DOM operations
                });
            }
        };

        processChunk();
    }

    private collapseAllItemsChunked(itemCount: number, configurationKey: string, from: string): void {
        const chunkSize = 100; // Larger chunks for DOM operations (much faster than form creation)
        let currentIndex = 0;

        const processChunk = () => {
            const endIndex = Math.min(currentIndex + chunkSize, itemCount);

            for (let i = currentIndex; i < endIndex; i++) {
                this.expandCollapseSingleItem(configurationKey, i, false, from);
            }

            currentIndex = endIndex;

            if (currentIndex < itemCount) {
                this.zone.runOutsideAngular(() => {
                    setTimeout(() => {
                        this.zone.run(() => processChunk());
                    }, 5); // Much shorter delay for DOM operations
                });
            }
        };

        processChunk();
    }

    toggleDropdown(configurationKey: string): void {
        const dropDown = document.getElementById('export-dropdown-' + configurationKey);
        if (dropDown) {
            dropDown.classList.toggle('is-active');
        }
    }

    hideDropDown(configurationKey: string): void {
        const dropdown = document.getElementById('export-dropdown-' + configurationKey);
        if (dropdown && dropdown.classList.contains('is-active')) {
            dropdown.classList.toggle('is-active');
        }
    }

    handleViewportScrolling(
        viewport: any,
        itemCount: number,
        smoothScroll = true
    ): void {
        if (!viewport) return;

        this.zone.runOutsideAngular(() => {
            requestAnimationFrame(() => {
                viewport.checkViewportSize();

                setTimeout(() => {
                    if (smoothScroll) {
                        viewport.scrollToIndex(itemCount - 1, 'smooth');
                    } else {
                        viewport.scrollToIndex(itemCount - 1);
                    }
                }, 0);
            });
        });
    }
} 