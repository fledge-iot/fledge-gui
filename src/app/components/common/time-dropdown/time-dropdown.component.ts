import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { Subscription, fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DEBOUNCE_TIME } from '../../../utils';

@Component({
  selector: 'app-time-dropdown',
  templateUrl: './time-dropdown.component.html',
  styleUrls: ['./time-dropdown.component.css']
})
export class TimeDropdownComponent implements OnInit, OnDestroy {
  graphUnit = ['seconds', 'minutes', 'hours', 'days'];
  optedTime = 600; // Set graph optedTime to default 10 minutes
  selectedUnit: string = 'minutes';

  @ViewChild('time', { static: true }) timeInput: ElementRef;
  private fromEventSub: Subscription;

  @Output() updateGraphEvent = new EventEmitter<number>();
  @Output() dropdownOpenEvent = new EventEmitter<boolean>();

  constructor() { }

  ngOnInit(): void {
    this.timeInput.nativeElement.value = 10;
    let rGraphDefaultDuration = localStorage.getItem('READINGS_GRAPH_DEFAULT_DURATION');
    if (rGraphDefaultDuration !== null) {
      this.optedTime = parseInt(rGraphDefaultDuration);
    }

    this.fromEventSub = fromEvent(this.timeInput.nativeElement, 'input')
      .pipe(distinctUntilChanged(), debounceTime(DEBOUNCE_TIME))
      .subscribe(() => {
        if (this.timeInput.nativeElement.value !== '') {
          this.optedTime = this.calculateOptedTime();
          this.updateGraphEvent.emit(this.optedTime);
        }
      })

  }

  public toggleDropdown() {
    const dropDown = document.querySelector('#unit-dropdown');
    dropDown.classList.toggle('is-active');
    if (!dropDown.classList.contains('is-active')) {
      this.dropdownOpenEvent.emit(false);
    } else {
      this.dropdownOpenEvent.emit(true);
    }
  }

  setGraphUnit(unit: string) {
    this.selectedUnit = unit;
    this.optedTime = this.calculateOptedTime();
    // emit changed graph time
    this.updateGraphEvent.emit(this.optedTime);
    this.toggleDropdown();
  }

  getMaxTime() {
    if (this.selectedUnit === 'seconds') {
      return 7 * 24 * 60 * 60;
    }
    if (this.selectedUnit === 'minutes') {
      return 7 * 24 * 60;
    }
    if (this.selectedUnit === 'hours') {
      return 7 * 24;
    }
    return 7;
  }

  calculateOptedTime() {
    let value = this.timeInput.nativeElement.value;
    if (this.selectedUnit === 'seconds') {
      if (value > this.getMaxTime() || value === '0' || value === '') {
        this.timeInput.nativeElement.value = 1;
        return 1;
      }
      return value;
    }
    if (this.selectedUnit === 'minutes') {
      if (value > this.getMaxTime() || value === '0' || value === '') {
        this.timeInput.nativeElement.value = 1;
        return 60;
      }
      return value * 60;
    }
    if (this.selectedUnit === 'hours') {
      if (value > this.getMaxTime() || value === '0' || value === '') {
        this.timeInput.nativeElement.value = 1;
        return 60 * 60;
      }
      return value * 60 * 60;
    }
    if (value > this.getMaxTime() || value === '0' || value === '') {
      this.timeInput.nativeElement.value = 1;
      return 60 * 60 * 24;
    }
    return value * 60 * 60 * 24;
  }

  ngOnDestroy(): void {
    this.fromEventSub.unsubscribe();
  }

}
