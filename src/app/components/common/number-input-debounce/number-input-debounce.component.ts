import { Component, Input, Output, ElementRef, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime';

@Component({
  selector: 'app-number-input-debounce',
  template: '<input class="input is-small" type="number" appNumberOnly min="0" [value]="val" [max]="max" [placeholder]="placeholder" name="limit" [(ngModel)]="inputValue">',
  styleUrls: ['./number-input-debounce.component.css']
})
export class NumberInputDebounceComponent {
  @Input() placeholder: string;
  @Input() max: string;
  @Input() delay = 2000;
  @Input() val = 0;
  @Output() value: EventEmitter<any> = new EventEmitter();

  public inputValue: string;

  constructor(private elementRef: ElementRef) {
    const eventStream = Observable.fromEvent(elementRef.nativeElement, 'keyup')
      .map(() => this.inputValue)
      .debounceTime(this.delay);

    eventStream.subscribe(input => this.value.emit(input));
  }
}
