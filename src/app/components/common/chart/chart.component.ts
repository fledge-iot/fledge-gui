import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { Chart } from 'chart.js';
import { Subscription } from 'rxjs';
import Utils from '../../../utils';
import { RangeSliderService } from '../range-slider/range-slider.service';

@Component({
  selector: 'app-chart',
  template: '<canvas></canvas>',
  styles: [':host { display: block; }']
})
export class ChartComponent implements OnInit, OnChanges, OnDestroy {
  chart: any;

  @Input() type: string;
  @Input() data: any;
  @Input() options: any;
  private subscription: Subscription;

  constructor(private elementRef: ElementRef, private rangeSliderService: RangeSliderService) { }

  ngOnInit() { }

  ngOnChanges() {
    this.setAlpha();
    if (this.chart) {
      this.chart.destroy();
    }
    this.chart = new Chart(this.elementRef.nativeElement.querySelector('canvas'), {
      type: this.type,
      data: this.data,
      options: this.options
    });
    this.chart.update(0);
  }

  /**
   * Set graph line color Alpha
   */
  setAlpha() {
    if (this.data === undefined || this.data.length <= 0) {
      return;
    }
    this.subscription = this.rangeSliderService.alphaSubject
      .subscribe((alpha: number) => {
        this.data.datasets.map((d: any) => {
          d.borderColor = Utils.transparentize(d.borderColor, alpha);
        })
        if (this.chart && this.chart.ctx != null) {
          this.chart.update(0);
        }
      });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    if (this.chart) {
      this.chart.destroy();
    }
  }
}
