import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { ClassicPreset } from 'rete';
import { Position } from '../types';
import { SharedService } from '../../../../services';

type Connection = ClassicPreset.Connection<
  ClassicPreset.Node,
  ClassicPreset.Node
> & {
  selected?: boolean,
  isLoop?: boolean
  click: (c: Connection) => void
  remove: (c: Connection) => void
}

@Component({
  selector: 'app-custom-connection',
  templateUrl: './custom-connection.component.html',
  styleUrls: ['./custom-connection.component.css']
})
export class CustomConnectionComponent {
  @Input() data!: Connection
  @Input() start: Position
  @Input() end: Position
  @Input() path: string

  @ViewChild('menu') menu!: ElementRef;
  @ViewChild('svg') connection!: ElementRef<SVGAElement>;
  @ViewChild('svgpath', { static: true }) pathRef: ElementRef<SVGPathElement>;

  constructor(private sharedService: SharedService) { }

  showDebuggerReadings() {
    const nodeId = this.data.source;
    this.sharedService.bufferReadings.next({ show: true, nodeId });
  }
}
