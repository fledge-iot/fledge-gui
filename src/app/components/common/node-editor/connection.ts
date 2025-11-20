import { CurveFactory } from 'd3-shape';
import { Filter, North, Notification, South, DebugDataDisplay } from './nodes';
import { ClassicPreset } from 'rete';

type Node = South | North | Filter | Notification | DebugDataDisplay;
export class Connection<A extends Node, B extends Node> extends ClassicPreset.Connection<A, B> {
  selected?: boolean
  click: (data: Connection<A, B>) => void
  remove: (data: Connection<A, B>) => void
  curve?: CurveFactory;
  debuggerAttached? = false;

  constructor(events: { click: (data: Connection<A, B>) => void, remove: (data: Connection<A, B>) => void }, source: A, target: B, public isLoop?: boolean) {
    super(source, 'port', target, 'port')
    this.click = events.click;
    this.remove = events.remove;
    this.isLoop = false;
  }
}
