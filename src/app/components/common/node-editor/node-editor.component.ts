import { Component, ElementRef, Injector, OnInit, ViewChild } from '@angular/core';
import { createEditor } from './editor';

@Component({
  selector: 'app-node-editor',
  templateUrl: './node-editor.component.html',
  styleUrls: ['./node-editor.component.css']
})
export class NodeEditorComponent implements OnInit {

  @ViewChild("rete") container!: ElementRef;

  constructor(public injector: Injector) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    const el = this.container.nativeElement;

    if (el) {
      createEditor(el, this.injector);
    }
  }

}
