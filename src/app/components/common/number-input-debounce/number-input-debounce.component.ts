import { Component, ElementRef, EventEmitter, Input, Output } from '@angular/core';
import { fromEvent } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';

@Component({
  selector: 'app-number-input-debounce',
  template: '<input class="input is-small" type="number" appNumberOnly min="0" [value]="val" [max]="max"' +
              '[placeholder]="placeholder" name="limit" [(ngModel)]="inputValue">',
  styleUrls: ['./number-input-debounce.component.css']
})
export class NumberInputDebounceComponent {
  @Input() placeholder: string;
  @Input() max: string;
  @Input() delay = 2000;
  @Input() val = 0;
  @Output() value: EventEmitter<any> = new EventEmitter();

  public inputValue: string;

  constructor(elementRef: ElementRef) {
    const eventStream = fromEvent(elementRef.nativeElement, 'keyup').pipe(
      map(() => this.inputValue),
      debounceTime(this.delay));

    eventStream.subscribe(input => this.value.emit(input));
  }
}
