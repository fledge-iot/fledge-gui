import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-delay',
  templateUrl: './delay.component.html',
  styleUrls: ['./delay.component.css']
})
export class DelayComponent implements OnInit {
  @Input() config;

  constructor() { }

  ngOnInit(): void {
  }

}
