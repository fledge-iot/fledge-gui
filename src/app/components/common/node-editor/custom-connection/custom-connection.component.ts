import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { ClassicPreset } from 'rete';
import { classicConnectionPath } from 'rete-render-utils'
import { Position } from '../types';
import { FlowEditorService } from '../flow-editor.service';
import { Subscription } from 'rxjs';

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
  @ViewChild('svgpath', { static: true }) svgpath: ElementRef;
  selected: boolean = false;
  private canvasClickSubscription: Subscription;
  selectedConnectionId = "";

  constructor(public flowEditorService: FlowEditorService) { }

  ngOnInit(): void {
    this.canvasClickSubscription =  this.flowEditorService.canvasClick.subscribe(data => {
      this.selectedConnectionId = data.connectionId;
      if(data.canvasClicked === true){
        if(this.selected){
          this.svgpath.nativeElement.style.stroke = "steelblue";
          this.selected = false;
          this.flowEditorService.connectionInfo.next({id: this.data.id, selected: this.selected});
        }
      }
    })
  }

  selectConnection(): void {
    setTimeout(() => {
      if(!this.selected && this.selectedConnectionId !== this.data.id){
        this.svgpath.nativeElement.style.stroke = "rgb(255, 217, 44)";
        this.selected = true;
        this.flowEditorService.connectionInfo.next({id: this.data.id, selected: this.selected});
      }
    }, 1);
  }

  ngOnDestroy() {
    this.canvasClickSubscription.unsubscribe();
  }
}
