import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { Chart } from 'chart.js';

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

  constructor(private elementRef: ElementRef) { }

  ngOnInit() { }

  ngOnChanges() {
    if (this.chart) {
      this.chart.destroy();
    }
    this.chart = new Chart(this.elementRef.nativeElement.querySelector('canvas'), {
      type: this.type,
      data: this.data,
      options: this.options === undefined ? {
        legend: {
          onClick: (e, legendItem) => {
            console.log('item clicked', e);
            const index = legendItem.datasetIndex;
            const ci = this.chart;
            const meta = ci.getDatasetMeta(index);
            meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;

            if (legendItem.hidden === false) {
              sessionStorage.setItem(legendItem.text, JSON.stringify(true));
            } else {
              sessionStorage.setItem(legendItem.text, null);
            }
            ci.update();
          }
        }
      } : this.options
    });
    this.chart.update(0);
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }
}
