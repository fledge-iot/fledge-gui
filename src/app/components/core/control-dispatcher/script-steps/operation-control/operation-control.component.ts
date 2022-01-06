import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-operation-control',
  templateUrl: './operation-control.component.html',
  styleUrls: ['./operation-control.component.css']
})
export class OperationControlComponent implements OnInit {
  @Input() config: any;
  constructor() { }

  ngOnInit(): void {
  }

}
