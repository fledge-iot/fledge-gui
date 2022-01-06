import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-config-control',
  templateUrl: './config-control.component.html',
  styleUrls: ['./config-control.component.css']
})
export class ConfigControlComponent implements OnInit {
  @Input() config: any;
  constructor() { }

  ngOnInit(): void {
  }

}
