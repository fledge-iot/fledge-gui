import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { ClassicPreset } from 'rete';
import { Position } from '../types';
import { SharedService } from '../../../../services';
import { area } from '../editor';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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

  public isAlive: boolean;
  destroy$: Subject<boolean> = new Subject<boolean>();

  @ViewChild('menu') menu!: ElementRef;
  @ViewChild('svg') connection!: ElementRef<SVGAElement>;
  @ViewChild('svgpath', { static: true }) pathRef: ElementRef<SVGPathElement>;

  debuggerAttached = false;

  constructor(private sharedService: SharedService) { }

  ngAfterViewInit() {
    this.sharedService.debuggerStateSubject
      .pipe(takeUntil(this.destroy$))
      .subscribe((debuggerAttached: boolean) => {
        if (debuggerAttached !== this.debuggerAttached) {
          this.debuggerAttached = debuggerAttached;
          setTimeout(() => {
            if (this.debuggerAttached) {
              this.updateConnectionIconPosition();
            }
          });
        }
      });
  }

  showDebuggerReadings() {
    const nodeId = this.data.source;
    this.sharedService.bufferReadings.next({ show: true, nodeId });
  }

  updateConnectionIconPosition() {
    const path = this.pathRef.nativeElement;
    const icon = document.querySelector<HTMLElement>(`#${CSS.escape(this.data.id)}`);
    if (!path?.getTotalLength || !icon) return;

    const length = path.getTotalLength();
    if (length === 0) return;

    const mid = path.getPointAtLength(length / 2);
    icon.style.left = `${mid.x}px`;
    icon.style.top = `${mid.y}px`;
    area.update('connection', this.data.id);
  }

  public ngOnDestroy(): void {
    this.isAlive = false;
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
