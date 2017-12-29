import { Component, OnInit, ViewChild } from '@angular/core';
import { AssetsService, AlertService } from '../../services/index';
import { AssetSummaryComponent } from './../asset-summary/asset-summary.component';
import { ChartModalComponent } from './../chart-modal/chart-modal.component';
import { NgProgress } from 'ngx-progressbar';

@Component({
  selector: 'app-assets',
  templateUrl: './assets.component.html',
  styleUrls: ['./assets.component.css']
})
export class AssetsComponent implements OnInit {

  selectedAsset: any = 'Select'; // Selected asset object (asset_coded, asset_count)
  asset: any;
  limit: number = 20;
  offset: number = 0;

  page = 1;           // Default page is 1 in pagination
  recordCount = 0;    // Total no. of records during pagination
  tempOffset: number = 0;     // Temporary offset during pagination
  totalPagesCount = 0;
  assets = [];
  assetsReadingsData = [];

  public assetData: Object;
  public isChart = false;
  public isSummary = false;

  public isInvalidLimit = false;
  public isInvalidOffset = false;

  @ViewChild(AssetSummaryComponent) assetSummaryComponent: AssetSummaryComponent;
  @ViewChild(ChartModalComponent) chartModalComponent: ChartModalComponent;

  constructor(private assetService: AssetsService, private alertService: AlertService, public ngProgress: NgProgress) { }

  ngOnInit() {
    this.getAsset();
  }

  /**
   *  Go to the page on which user clicked in pagination
   */
  goToPage(n: number): void {
    this.page = n;
    this.setLimitOffset();
  }

  /**
   *  Go to the next page
   */
  onNext(): void {
    this.page++;
    this.setLimitOffset();
  }

  /**
   *  Go to the previous page
   */
  onPrev(): void {
    this.page--;
    this.setLimitOffset();
  }

  /**
   *  Go to the first page
   */
  onFirst(): void {
    this.page = 1;
    this.setLimitOffset();
  }

  /**
   *  Go to the last page
   */
  onLast(n: number): void {
    const p = Math.ceil(this.recordCount / this.limit) || 0;
    this.page = p;
    this.setLimitOffset();
  }

  /**
   *  Calculate number of pages for pagination based on total records;
   */
  public totalPages() {
    this.totalPagesCount = Math.ceil(this.recordCount / this.limit) || 0;
  }

  /**
   *  Set limit and offset (it is internally called by goToPage(), onNext(), onPrev(), onFirst(), onLast()  methods)
   */
  setLimitOffset() {
    if (this.limit === 0) {
      this.limit = 20;
    }
    if (this.offset > 0) {
      this.tempOffset = ((this.page - 1) * this.limit) + this.offset;
    } else {
      this.tempOffset = (this.page - 1) * this.limit;
    }
    console.log('limit: ', this.limit);
    console.log('offset: ', this.offset);
    console.log('temp offset: ', this.tempOffset);
    this.getAssetReading();
  }

  public setAssetCode(assetData) {
    this.isChart = true;
    this.isSummary = true;
    this.asset = assetData;
    if (this.offset !== 0) {
      this.recordCount = this.asset['count'] - this.offset;
    }
    this.getAssetReading();
  }

  /**
   *  Set limit
   */
  public setLimit(limit) {
    if (this.asset === undefined) {
      return;
    }
    this.isInvalidLimit = false;
    if (+limit > 1000) {
      this.isInvalidLimit = true; // limit range validation 
      return;
    }
    if (this.page !== 1) {
      this.page = 1;
      this.tempOffset = this.offset;
    }
    if (limit === '' || limit == 0 || limit === null || limit === undefined) {
      limit = 20;
    }
    this.limit = limit;
    console.log('Limit: ', this.limit);
    this.getAssetReading();
  }

  /**
   *  Set offset
   */
  public setOffset(offset: number) {
    if (this.asset === undefined) {
      return;
    }
    this.isInvalidOffset = false;
    if (offset > 2147483647) {
      this.isInvalidOffset = true; // offset range validation
      return;
    }
    if (this.page !== 1) {
      this.page = 1;
    }
    if (offset === null || offset === undefined) {
      offset = 0;
    }
    this.offset = offset;
    this.tempOffset = offset;
    this.recordCount = this.asset['count'] - this.offset;
    console.log('Offset: ', this.offset);
    this.getAssetReading();
  }

  public getAsset(): void {
    this.assets = [];
    /** request started */
    this.ngProgress.start();
    this.assetService.getAsset().
      subscribe(
      data => {
        /** request completed */
        this.ngProgress.done();
        if (data.error) {
          console.log('error in response', data.error);
          this.alertService.error(data.error.message);
          return;
        }
        this.assets = data;
        console.log('This is the asset data ', this.assets);
      },
      error => {
        /** request completed */
        this.ngProgress.done();
        console.log('error', error);
      });
  }

  /**
   *  Get data of Asset Readings
   */
  public getAssetReading(): void {
    if (this.offset === 0) {
      this.recordCount = this.asset['count'];
    }
    this.assetsReadingsData = [];
    /** request started */
    this.ngProgress.start();
    this.assetService.getAssetReadings(encodeURIComponent(this.asset['asset_code']), this.limit, this.tempOffset).
      subscribe(
      data => {
        /** request completed */
        this.ngProgress.done();
        if (data.error) {
          console.log('error in response', data.error);
          this.alertService.error(data.error.message);
          return;
        }
        this.assetsReadingsData = [{
          asset_code: this.asset['asset_code'],
          count: this.recordCount,
          data: data
        }];
        this.totalPages();
        console.log('This is the asset reading data ', this.assetsReadingsData);
      },
      error => {
        /** request completed */
        this.ngProgress.done();
        console.log('error', error);
      });
  }

  /**
 * Open asset summary modal dialog
 */
  public showAssetSummary(assetCode) {
    const dataObj = {
      asset_code: assetCode,
    };
    this.assetSummaryComponent.getReadingSummary(dataObj);
    this.assetSummaryComponent.toggleModal(true);
  }

  /**
  * Open asset chart modal dialog
  */
  public showAssetChart(asset_code) {
    this.chartModalComponent.plotReadingsGraph(asset_code, 0, 0);
    this.chartModalComponent.toggleModal(true);
  }
}