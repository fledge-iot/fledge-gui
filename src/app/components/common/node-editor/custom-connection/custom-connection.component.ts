import { Component, OnInit, Input } from '@angular/core';
import { ClassicPreset } from 'rete';
import { classicConnectionPath } from 'rete-render-utils'
import { Position } from '../types';

@Component({
  selector: 'app-custom-connection',
  templateUrl: './custom-connection.component.html',
  styleUrls: ['./custom-connection.component.css']
})
export class CustomConnectionComponent implements OnInit {

  @Input() data!: ClassicPreset.Connection<ClassicPreset.Node, ClassicPreset.Node>;
  @Input() start: Position
  @Input() end: Position
  @Input() path: string

  constructor() { }

  ngOnInit(): void {
  }

}
