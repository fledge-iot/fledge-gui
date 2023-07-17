import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-asset-reading-summary',
  templateUrl: './asset-reading-summary.component.html',
  styleUrls: ['./asset-reading-summary.component.css']
})
export class AssetReadingSummaryComponent {
  @Input() buttonText;
  @Input() showSummarySpinner;
  @Input() autoRefresh;
  @Input() assetReadingSummary;
  @Input() summaryLimit;
  constructor() { }

  public isNumber(val: string) {
    return typeof val === 'number';
  }

  public roundTo(num, to) {
    const _to = Math.pow(10, to);
    return Math.round(num * _to) / _to;
  }

  public showAll() {
    this.autoRefresh = false;
    if (this.buttonText === 'Show Less') {
      this.summaryLimit = 5;
      this.buttonText = 'Show All';
    } else {
      this.summaryLimit = this.assetReadingSummary.length;
      this.buttonText = 'Show Less';
    }
  }

}
