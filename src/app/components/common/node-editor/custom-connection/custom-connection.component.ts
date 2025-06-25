import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { ClassicPreset } from 'rete';
import { Position } from '../types';
import { SharedService } from '../../../../services';
import { area } from '../editor';
import { Subject } from 'rxjs';
import { distinctUntilChanged, map, takeUntil } from 'rxjs/operators';

type Connection = ClassicPreset.Connection<
  ClassicPreset.Node,
  ClassicPreset.Node
> & {
  selected?: boolean,
  isLoop?: boolean
  debuggerAttached?: boolean;
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

  constructor(private sharedService: SharedService) { }

  ngAfterViewInit() {
    // TODO: Add connection icon position for debugger
    // this.sharedService.debuggerStateSubject
    //   .pipe(
    //     takeUntil(this.destroy$),
    //     map((debuggerData: any) => debuggerData?.debug?.debugger === 'Attached'),
    //     distinctUntilChanged()
    //   )
    //   .subscribe((isAttached: boolean) => {
    //     this.data.debuggerAttached = isAttached;
    //     if (isAttached) {
    //       setTimeout(() => {
    //          this.updateConnectionIconPosition();
    //       });
    //     }
    //   });
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
