import { Component, Input, ElementRef, OnInit, OnChanges, OnDestroy } from '@angular/core';
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
    this.chart = new Chart(this.elementRef.nativeElement.querySelector('canvas'), {
      type: this.type,
      data: this.data,
      options: this.options
    });
    this.chart.update(0);
    // TODO: Need to fix for dynamic graphs
    // if (this.chart && changes['data']) {
    //   const currentValue = changes['data'].currentValue;
    //   ['datasets', 'labels', 'xLabels', 'yLabels'].forEach(property => {
    //     this.chart.data[property] = currentValue[property];
    //   });
    //   this.chart.update();
    // }
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }
}
