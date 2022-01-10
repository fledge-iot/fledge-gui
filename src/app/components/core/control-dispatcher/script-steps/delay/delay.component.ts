import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-delay',
  templateUrl: './delay.component.html',
  styleUrls: ['./delay.component.css']
})
export class DelayComponent implements OnInit {
  @Input() config;
  @Output() update = new EventEmitter<any>();
  constructor() { }

  ngOnInit(): void {
  }

  getValue(value) {
    console.log(this.config);
    console.log('event', value);
    this.config.value.duration = value
    this.update.emit(this.config);
  }

}
