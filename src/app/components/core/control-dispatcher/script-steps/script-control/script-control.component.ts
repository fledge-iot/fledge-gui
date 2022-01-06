import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-script-control',
  templateUrl: './script-control.component.html',
  styleUrls: ['./script-control.component.css']
})
export class ScriptControlComponent implements OnInit {
  @Input() config: any;
  constructor() { }

  ngOnInit(): void {
  }

}
