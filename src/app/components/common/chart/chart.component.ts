import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { Chart } from 'chart.js';
import { Subscription } from 'rxjs';
import { isEmpty } from 'lodash';
import Utils from '../../../utils';
import { RangeSliderService } from '../range-slider/range-slider.service';

@Component({
  selector: 'app-chart',
  template: '<canvas></canvas>',
  styles: [':host { display: block; }']
})
export class ChartComponent implements OnInit, OnChanges, OnDestroy {
  chart: any;
  @Input() from: string;
  @Input() type: string;
  @Input() data: any;
  @Input() options: any;
  private subscription: Subscription;

  constructor(private elementRef: ElementRef, private rangeSliderService: RangeSliderService) { }

  ngOnInit() { }

  ngOnChanges() {
    // set alpha only for asset reading graphs
    if (this.from && this.from !== 'dashboard') {
      this.setAlpha();
    }
    if (this.chart) {
      if (!isEmpty(this.data)) {
        this.chart.data.datasets.forEach((dataset) => {
          dataset.data = this.data.datasets.find(d => dataset.label === d.label).data;
        });
        this.chart.data.labels = this.data.labels;
        this.chart.update(0);
      }
    } else {
      if (!isEmpty(this.data)) {
        this.chart = new Chart(this.elementRef.nativeElement.querySelector('canvas'), {
          type: this.type,
          data: this.data,
          options: this.options
        });
        this.chart.update(0);
      }
    }
  }

  /**
   * Set graph line color Alpha
   */
  setAlpha() {
    if (isEmpty(this.data)) {
      return;
    }
    this.subscription = this.rangeSliderService.alphaSubject
      .subscribe((alpha: number) => {
        if (this.chart && this.chart.ctx != null) {
          this.chart.data.datasets.map((d: any) => {
            d.borderColor = Utils.transparentize(d.borderColor, alpha);
          })
          this.chart.update(0);
        }
      });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.chart) {
      this.chart.destroy();
    }
  }
}
