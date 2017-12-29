import {Component, Input, Output, ElementRef, EventEmitter} from '@angular/core';
import {Observable} from 'rxjs/Rx';

@Component({
    selector: 'number-input-debounce',
    template: '<input class="input" type="number" appNumberOnly min="0" [max]="max" [placeholder]="placeholder" name="limit" [(ngModel)]="inputValue">',
    styleUrls: ['./number-input-debounce.component.css']
})
export class NumberInputDebounceComponent {
    @Input() placeholder: string;
    @Input() max: string;
    @Input() delay = 2000;
    @Output() value: EventEmitter<any> = new EventEmitter();

    public inputValue: string;

    constructor(private elementRef: ElementRef) {
        const eventStream = Observable.fromEvent(elementRef.nativeElement, 'keyup')
            .map(() => this.inputValue)
            .debounceTime(this.delay)
            .distinctUntilChanged();

        eventStream.subscribe(input => this.value.emit(input));
    }
}
