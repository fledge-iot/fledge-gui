import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-time-dropdown',
  templateUrl: './time-dropdown.component.html',
  styleUrls: ['./time-dropdown.component.css']
})
export class TimeDropdownComponent implements OnInit {
  graphTime = [
    { key: '1 minute', value: 60 },
    { key: '5 minutes', value: 300 },
    { key: '10 minutes', value: 600 },
    { key: '30 minutes', value: 1800 },
    { key: '1 hour', value: 3600 },
    { key: '8 hours', value: 28800 },
    { key: '1 day', value: 86400 },
    { key: '1 week', value: 604800 }
  ];

  optedTime = this.graphTime[2].value; // Set graph optTime to default 10 minutes

  @Output() updateGraphEvent = new EventEmitter<number>();
  @Output() dropdownOpenEvent = new EventEmitter<boolean>();

  constructor() { }

  ngOnInit(): void { }

  setDropdownLabel(optedTime: number) {
    return this.graphTime.find(t => t.value === optedTime).key;
  }

  public toggleDropdown() {
    const dropDown = document.querySelector('#time-dropdown');
    dropDown.classList.toggle('is-active');
    if (!dropDown.classList.contains('is-active')) {
      this.dropdownOpenEvent.emit(false);
    } else {
      this.dropdownOpenEvent.emit(true);
    }
  }

  setGraphTime(time: number) {
    this.optedTime = time;
    // emit changed graph time
    this.updateGraphEvent.emit(time);
    this.toggleDropdown();
  }

}
