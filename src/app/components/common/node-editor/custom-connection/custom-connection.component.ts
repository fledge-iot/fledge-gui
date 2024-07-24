import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { ClassicPreset } from 'rete';
import { Position } from '../types';

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

  // code block to show label on the connection line
  // get point() {
  //   if (!this.pathRef) return { x: 0, y: 0 }
  //   const path = this.pathRef.nativeElement
  //   if (path.getTotalLength() != 0) {
  //     const point = path?.getPointAtLength(path.getTotalLength() / 2)
  //     return point;
  //   }
  //   return { x: 0, y: 0 }
  // }
}
