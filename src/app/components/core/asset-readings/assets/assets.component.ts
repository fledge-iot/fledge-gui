import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { orderBy } from 'lodash';
import { interval, Subject, Subscription } from 'rxjs';
import { takeWhile, takeUntil, finalize } from 'rxjs/operators';
import { DialogService } from '../../../common/confirmation-dialog/dialog.service';

import { AlertService, AssetsService, SharedService, PingService, GenerateCsvService, ProgressBarService, RolesService } from '../../../../services';
import { DocService } from '../../../../services/doc.service';
import { ImageProcessingService } from '../../../../services/image-processing.service';
import { MAX_INT_SIZE, POLLING_INTERVAL } from '../../../../utils';
import { ReadingsGraphComponent } from '../readings-graph/readings-graph.component';
import { DeveloperFeaturesService } from '../../../../services/developer-features.service';
import { PopoverComponent } from '../../../common/popover/popover.component';

@Component({
  selector: 'app-assets',
  templateUrl: './assets.component.html',
  styleUrls: ['./assets.component.css']
})
export class AssetsComponent implements OnInit, OnDestroy {
  MAX_RANGE = MAX_INT_SIZE / 2;
  assets = [];
  public refreshInterval = POLLING_INTERVAL;
  public showSpinner = false;
  public isAlive: boolean;
  assetReadings = [];
  selectedAssetName = '';
  latestReadings: { [key: string]: any } = {};  // Store latest readings for each asset
  private isPopoverVisible = false;
  private popoverAssetCode: string | null = null;
  private popoverHiddenSubscription: any = null;
  private hoverTimeout: any = null;
  private HOVER_DELAY = 300; // ms
  private imageUrlCache: Map<string, string> = new Map<string, string>();
  private refreshSubscription: Subscription | null = null;
  private latestReadingInFlight: Set<string> = new Set<string>();
  private latestReadingPropsCache: Map<string, { timestamp: string, props: { key: string, value: any, type?: string, imageUrl?: string }[] }>
    = new Map<string, { timestamp: string, props: { key: string, value: any, type?: string, imageUrl?: string }[] }>();
  private activePopover: PopoverComponent | null = null;

  @ViewChild(ReadingsGraphComponent, { static: true }) readingsGraphComponent: ReadingsGraphComponent;

  destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private assetService: AssetsService,
    private alertService: AlertService,
    private dialogService: DialogService,
    private generateCsvService: GenerateCsvService,
    private docService: DocService,
    public developerFeaturesService: DeveloperFeaturesService,
    private ngProgress: ProgressBarService,
    private ping: PingService,
    private sharedService: SharedService,
    public rolesService: RolesService,
    private imageProcessingService: ImageProcessingService) {
    this.isAlive = true;
    this.ping.pingIntervalChanged
      .pipe(takeUntil(this.destroy$))
      .subscribe((timeInterval: number) => {
        if (timeInterval === -1) {
          this.isAlive = false;
        }
        this.refreshInterval = timeInterval;
      });
  }

  ngOnInit() {
    this.showLoadingSpinner();
    this.getAsset();
    this.startRefreshInterval();
  }

  public getAsset(showProgressBar = true): void {
    /** request started */
    if (!this.isAlive && showProgressBar) {
      this.ngProgress.start();
    }
    this.assetService.getAsset()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data: any[]) => {
          /** request completed */
          this.ngProgress.done();
          this.assets = data;
          this.assets = orderBy(this.assets, ['assetCode'], ['asc']);
          this.sharedService.assets.next(this.assets);
          this.hideLoadingSpinner();
        },
        error => {
          /** request completed but error */
          this.ngProgress.done();
          this.hideLoadingSpinner();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public loadLatestReading(assetCode: string): void {
    // Prevent overlapping requests per asset
    if (this.latestReadingInFlight.has(assetCode)) {
      return;
    }
    this.latestReadingInFlight.add(assetCode);

    this.assetService.getLatestReadings(assetCode)
      .pipe(takeUntil(this.destroy$), finalize(() => this.latestReadingInFlight.delete(assetCode)))
      .subscribe(
        (data: any[]) => {
          if (data && data.length > 0) {
            const latestReading = data[0];
            this.latestReadings[assetCode] = {
              reading: latestReading.reading,
              timestamp: latestReading.timestamp
            };
            // Invalidate cached props for this asset if timestamp changed
            const cached = this.latestReadingPropsCache.get(assetCode);
            if (!cached || cached.timestamp !== latestReading.timestamp) {
              this.latestReadingPropsCache.delete(assetCode);
            }
          } else {
            this.latestReadings[assetCode] = { reading: {}, timestamp: '' };
            this.latestReadingPropsCache.delete(assetCode);
          }
        },
        error => {
          console.log('error fetching latest reading', error);
        }
      );
  }

  public getLatestReadingData(assetCode: string): any {
    return this.latestReadings[assetCode] || {
      reading: {},
      timestamp: ''
    };
  }

  public getLatestReadingTimestamp(assetCode: string): string {
    const data = this.getLatestReadingData(assetCode);
    return data.timestamp;
  }

  public getLatestReadingProperties(assetCode: string): { key: string, value: any, type?: string, imageUrl?: string }[] {
    const data = this.getLatestReadingData(assetCode);
    const currentTimestamp: string = data.timestamp || '';

    const cached = this.latestReadingPropsCache.get(assetCode);
    if (cached && cached.timestamp === currentTimestamp) {
      return cached.props;
    }

    const properties: { key: string, value: any, type?: string, imageUrl?: string }[] = [];
    if (data.reading && typeof data.reading === 'object') {
      Object.keys(data.reading).forEach(key => {
        const value = data.reading[key];

        if (typeof value === 'string' && value.includes('__DPIMAGE:')) {
          let imageUrl = this.imageUrlCache.get(value);
          if (!imageUrl) {
            imageUrl = this.imageProcessingService.processImageReading(value);
            this.imageUrlCache.set(value, imageUrl);
          }
          properties.push({ key, value, type: 'image', imageUrl });
        } else {
          let displayValue = value;
          let type = 'text';
          if (typeof value === 'object') {
            displayValue = JSON.stringify(value);
            type = 'object';
          } else if (typeof value === 'number') {
            type = 'number';
          }
          properties.push({ key, value: displayValue, type });
        }
      });
    }

    this.latestReadingPropsCache.set(assetCode, { timestamp: currentTimestamp, props: properties });
    return properties;
  }



  public hasNonImageReadings(assetCode: string): boolean {
    const properties = this.getLatestReadingProperties(assetCode);
    return properties.some(reading => reading.type !== 'image');
  }

  public showPopover(triggerElement: HTMLElement, assetCode: string, popover: PopoverComponent): void {
    popover.show(triggerElement);
    this.isPopoverVisible = true;
    this.popoverAssetCode = assetCode;
    this.activePopover = popover;

    // Clean up any existing subscription
    if (this.popoverHiddenSubscription) {
      this.popoverHiddenSubscription.unsubscribe();
    }

    // Subscribe to popover visibility events to track actual visibility state
    this.popoverHiddenSubscription = popover.popoverHidden
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.isPopoverVisible = false;
        this.popoverAssetCode = null;
        this.popoverHiddenSubscription = null;
        this.activePopover = null;
        // Clear cached image URLs to avoid unbounded growth
        this.imageUrlCache.clear();
      });
  }

  public hidePopoverWithDelay(popover: PopoverComponent): void {
    popover.hideWithDelay();
  }

  /**
   * Handles mouse enter with delay - only loads data and shows popover if user hovers for HOVER_DELAY ms
   */
  public onHoverEnter(triggerElement: HTMLElement, assetCode: string, popover: PopoverComponent): void {
    // Clear any existing timeout
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }

    // Set timeout to show popover after delay
    this.hoverTimeout = setTimeout(() => {
      this.loadLatestReading(assetCode);
      this.showPopover(triggerElement, assetCode, popover);
      this.hoverTimeout = null;
    }, this.HOVER_DELAY);
  }

  /**
   * Handles mouse leave - cancels pending hover actions and hides popover
   */
  public onHoverLeave(popover: PopoverComponent): void {
    // Cancel pending hover timeout if user leaves before delay completes
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }

    // Hide popover with its own delay
    this.hidePopoverWithDelay(popover);
  }

  getAssetReadings(assetCode, recordCount) {
    this.assetReadings = [];
    const fileName = assetCode + '-readings';
    if (recordCount === 0) {
      this.alertService.error('No reading to export.', true);
      return;
    }
    this.alertService.activityMessage('Exporting readings to ' + fileName, true);
    let limit = recordCount;
    let offset = 0;
    let isLastRequest = false;
    if (recordCount > this.MAX_RANGE) {
      let chunkCount;
      let lastChunkLimit;
      limit = this.MAX_RANGE;
      chunkCount = Math.ceil(recordCount / this.MAX_RANGE);
      lastChunkLimit = (recordCount % this.MAX_RANGE);
      if (lastChunkLimit === 0) {
        lastChunkLimit = this.MAX_RANGE;
      }
      for (let j = 0; j < chunkCount; j++) {
        if (j !== 0) {
          offset = (this.MAX_RANGE * j);
        }
        if (j === (chunkCount - 1)) {
          limit = lastChunkLimit;
          isLastRequest = true;
        }
        this.exportReadings(assetCode, limit, offset, isLastRequest, fileName);
      }
    } else {
      this.exportReadings(assetCode, limit, offset, true, fileName);
    }
  }

  exportReadings(assetCode: any, limit: number, offset: number, lastRequest: boolean, fileName: string) {
    this.assetService.getAssetReadings(encodeURIComponent(assetCode), limit, offset)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data: any[]) => {
          data = data.map(r => {
            return r;
          });
          this.assetReadings = this.assetReadings.concat(data);
          if (lastRequest === true) {
            this.generateCsvService.download(this.assetReadings, fileName, 'asset');
          }
        },
        error => {
          console.log('error in response', error);
        });
  }

  purgeAssetData(assetCode) {
    /** request started */
    this.ngProgress.start();
    this.assetService.purgeAssetData(assetCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        () => {
          /** request completed */
          this.ngProgress.done();
          this.alertService.success(`${assetCode}'s  data purged successfully.`);
          this.closeModal('purge-asset-dialog');
          this.getAsset();
        }, error => {
          /** request completed but error */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  /**
  * Open asset chart modal dialog
  */
  public showAssetChart(assetCode) {
    this.hideActivePopover();
    this.readingsGraphComponent.getAssetCode(assetCode);
    this.readingsGraphComponent.toggleModal(true);
  }

  public showLatestReading(assetCode) {
    this.hideActivePopover();
    this.readingsGraphComponent.getAssetLatestReadings(assetCode);
    this.readingsGraphComponent.toggleModal(true);
  }

  public showLoadingSpinner() {
    this.showSpinner = true;
  }

  public hideLoadingSpinner() {
    this.showSpinner = false;
  }

  purgeAllAssetsData() {
    /** request started */
    this.ngProgress.start();
    this.assetService.purgeAllAssetsData()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        () => {
          /** request completed */
          this.ngProgress.done();
          this.alertService.success(`Successfully purged all stored asset names and associated data.`);
          this.closeModal('purge-all-assets-dialog');
          this.getAsset();
        }, error => {
          /** request completed but error */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  onNotify(event) {
    // Update alive state and (re)configure interval safely without duplicating subscriptions
    if (event === false) {
      this.isAlive = false;
      if (this.refreshSubscription) {
        this.refreshSubscription.unsubscribe();
        this.refreshSubscription = null;
      }
      return;
    }

    if (event === true && this.isAlive) {
      // Already alive; ensure only one interval is running
      if (!this.refreshSubscription) {
        this.startRefreshInterval();
      }
      return;
    }

    this.isAlive = true;
    this.startRefreshInterval();
  }

  goToLink() {
    const urlSlug = 'viewing.html';
    this.docService.goToViewQuickStartLink(urlSlug);
  }

  openModal(id: string) {
    this.dialogService.open(id);
  }

  closeModal(id: string) {
    this.dialogService.close(id);
  }

  setAsset(asset: any) {
    this.selectedAssetName = asset.assetCode;
  }

  public ngOnDestroy(): void {
    this.isAlive = false;
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
    this.popoverHiddenSubscription?.unsubscribe();
    this.refreshSubscription?.unsubscribe();

    // Clear hover timeout to prevent memory leaks
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
  }

  private startRefreshInterval(): void {
    // Avoid duplicate intervals
    this.refreshSubscription?.unsubscribe();
    this.refreshSubscription = interval(this.refreshInterval)
      .pipe(takeWhile(() => this.isAlive), takeUntil(this.destroy$))
      .subscribe(() => {
        // Skip auto refresh if popover is visible to avoid disrupting user interaction
        if (!this.isPopoverVisible) {
          this.getAsset(false);
        } else if (this.popoverAssetCode) {
          this.loadLatestReading(this.popoverAssetCode);
        }
      });
  }

  private hideActivePopover(): void {
    if (this.activePopover && this.activePopover.visible) {
      this.activePopover.hide(0);
    }
  }

  public trackByAssetCode(index: number, asset: any): string {
    return asset.assetCode;
  }
}
