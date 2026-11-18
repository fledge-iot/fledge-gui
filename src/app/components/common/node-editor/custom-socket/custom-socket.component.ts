import { Component, Input, ChangeDetectorRef, OnChanges } from '@angular/core';

@Component({
    selector: 'app-custom-socket',
    template: ``,
    styleUrls: ['./custom-socket.component.css'],
    standalone: false
})
export class CustomSocketComponent implements OnChanges {

  @Input() data!: any;
  @Input() rendered!: any;

  constructor(private cdr: ChangeDetectorRef) {
    this.cdr.detach()
  }

  ngOnChanges(): void {
    this.cdr.detectChanges()
    requestAnimationFrame(() => this.rendered())
  }
}
