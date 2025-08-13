import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { orderBy } from 'lodash';
import { interval, Subject } from 'rxjs';
import { takeWhile, takeUntil } from 'rxjs/operators';
import { DialogService } from '../../../common/confirmation-dialog/dialog.service';

import { AlertService, AssetsService, SharedService, PingService, GenerateCsvService, ProgressBarService, RolesService } from '../../../../services';
import { DocService } from '../../../../services/doc.service';
import { MAX_INT_SIZE, POLLING_INTERVAL } from '../../../../utils';
import { ReadingsGraphComponent } from '../readings-graph/readings-graph.component';
import { DeveloperFeaturesService } from '../../../../services/developer-features.service';

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
  popoverTimeouts: { [key: string]: any } = {};  // Store timeout references for each popover
  currentPopoverAsset = '';  // Track which asset's popover is currently shown

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
    public rolesService: RolesService) {
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
    interval(this.refreshInterval)
      .pipe(takeWhile(() => this.isAlive), takeUntil(this.destroy$)) // only fires when component is alive
      .subscribe(() => {
        this.getAsset();
      });
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
    this.assetService.getLatestReadings(assetCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data: any[]) => {
          if (data && data.length > 0) {
            const latestReading = data[0];
            this.latestReadings[assetCode] = {
              reading: latestReading.reading || {},
              timestamp: latestReading.timestamp || new Date().toISOString()
            };
          }
        },
        error => {
          console.log('error fetching latest reading', error);
          // Provide fallback data in case of error
          this.latestReadings[assetCode] = {
            reading: { error: "Unable to load" },
            timestamp: "N/A"
          };
        }
      );
  }

  public getLatestReadingData(assetCode: string): any {
    return this.latestReadings[assetCode] || {
      reading: { loading: "..." },
      timestamp: "Loading..."
    };
  }

  public getLatestReadingTimestamp(assetCode: string): string {
    const data = this.getLatestReadingData(assetCode);
    return data.timestamp || 'Loading...';
  }

  public getLatestReadingValues(assetCode: string): string {
    const data = this.getLatestReadingData(assetCode);
    if (data.reading && typeof data.reading === 'object') {
      return Object.keys(data.reading)
        .map(key => `${key} ${data.reading[key]}`)
        .join(', ');
    }
    return 'Loading...';
  }

  public getLatestReadingProperties(assetCode: string): { key: string, value: any }[] {
    const data = this.getLatestReadingData(assetCode);
    const properties = [];

    if (data.reading && typeof data.reading === 'object') {
      Object.keys(data.reading).forEach(key => {
        properties.push({
          key: key,
          value: data.reading[key]
        });
      });
    } else if (!data.reading || Object.keys(data.reading).length === 0) {
      properties.push({
        key: 'No readings',
        value: 'available'
      });
    }

    return properties;
  }

  public keepPopoverOpen(): void {
    // Clear any pending hide timeouts when hovering over popover content
    Object.keys(this.popoverTimeouts).forEach(key => {
      if (this.popoverTimeouts[key]) {
        clearTimeout(this.popoverTimeouts[key]);
        delete this.popoverTimeouts[key];
      }
    });
  }

  public hidePopoverWithDelay(): void {
    // Add a small delay before hiding to allow smooth transition between trigger and content
    const timeoutId = setTimeout(() => {
      this.hidePopover();
    }, 300); // 300ms delay

    // Store timeout reference
    this.popoverTimeouts['current'] = timeoutId;
  }

  public showPopover(event: MouseEvent, assetCode: string): void {
    // Clear any existing timeouts
    this.keepPopoverOpen();
    
    // Set current asset for popover content
    this.currentPopoverAsset = assetCode;
    
    // Get the trigger element position
    const target = event.target as HTMLElement;
    const trigger = target.closest('.popover-trigger') as HTMLElement;
    if (!trigger) return;
    
    // Get the global popover element
    const popover = document.getElementById('global-popover') as HTMLElement;
    if (!popover) return;
    
    // Calculate position relative to viewport
    const triggerRect = trigger.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Calculate initial position above the trigger
    let left = triggerRect.left + (triggerRect.width / 2);
    let top = triggerRect.top - 10; // 10px above the trigger
    let transformX = '-50%';
    let transformY = '-100%';
    
    // Check if popover would be clipped at the top
    const popoverHeight = 200; // Estimated popover height
    const spaceAbove = triggerRect.top;
    const spaceBelow = viewportHeight - triggerRect.bottom;
    
    // If not enough space above, position below instead
    if (spaceAbove < popoverHeight && spaceBelow > spaceAbove) {
      top = triggerRect.bottom + 10; // 10px below the trigger
      transformY = '0%';
      popover.classList.remove('above');
      popover.classList.add('below');
    } else {
      popover.classList.remove('below');
      popover.classList.add('above');
    }
    
    // Check if popover would be clipped horizontally
    const popoverWidth = 200; // Estimated popover width
    const spaceRight = viewportWidth - left + (popoverWidth / 2);
    const spaceLeft = left + (popoverWidth / 2);
    
    // Adjust horizontal position if clipped
    if (spaceRight < 0) {
      // Too far right, align to right edge
      left = triggerRect.right;
      transformX = '-100%';
    } else if (spaceLeft < 0) {
      // Too far left, align to left edge
      left = triggerRect.left;
      transformX = '0%';
    }
    
    // Ensure minimum margins from viewport edges
    const minMargin = 10;
    left = Math.max(minMargin, Math.min(left, viewportWidth - minMargin));
    top = Math.max(minMargin, Math.min(top, viewportHeight - minMargin));
    
    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
    popover.style.transform = `translate(${transformX}, ${transformY})`;
    popover.style.opacity = '1';
    popover.style.visibility = 'visible';
    
    // Ensure popover is on top of everything
    popover.style.zIndex = '999999';
  }

  public hidePopover(): void {
    const popover = document.getElementById('global-popover') as HTMLElement;
    if (popover) {
      popover.style.opacity = '0';
      popover.style.visibility = 'hidden';
      popover.classList.remove('above', 'below');
    }
    this.currentPopoverAsset = '';
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
    this.readingsGraphComponent.getAssetCode(assetCode);
    this.readingsGraphComponent.toggleModal(true);
  }

  public showLatestReading(assetCode) {
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
    this.isAlive = event;
    interval(this.refreshInterval)
      .pipe(takeWhile(() => this.isAlive), takeUntil(this.destroy$)) // only fires when component is alive
      .subscribe(() => {
        this.getAsset();
      });
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
  }
}
