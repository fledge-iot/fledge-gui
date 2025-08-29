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
        // Skip auto refresh if popover is visible to avoid disrupting user interaction
        if (!this.isPopoverVisible) {
          this.getAsset(false);
        } else {
          if (this.popoverAssetCode) {
            this.loadLatestReading(this.popoverAssetCode);
          }
        }
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
              reading: latestReading.reading,
              timestamp: latestReading.timestamp
            };
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
    }
    return properties;
  }

  public showPopover(triggerElement: HTMLElement, assetCode: string, popover: PopoverComponent): void {
    popover.show(triggerElement);
    this.isPopoverVisible = true;
    this.popoverAssetCode = assetCode;

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
      });
  }

  public hidePopoverWithDelay(popover: PopoverComponent): void {
    popover.hideWithDelay();
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
        // Skip auto refresh if popover is visible to avoid disrupting user interaction
        if (!this.isPopoverVisible) {
          this.getAsset(false);
        } else {
          if (this.popoverAssetCode) {
            this.loadLatestReading(this.popoverAssetCode);
          }
        }
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
    this.popoverHiddenSubscription?.unsubscribe();
  }
}
