import { Component, ElementRef, Injector, OnInit, ViewChild } from '@angular/core';
import { createEditor } from './editor';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-node-editor',
  templateUrl: './node-editor.component.html',
  styleUrls: ['./node-editor.component.css']
})
export class NodeEditorComponent implements OnInit {

  @ViewChild("rete") container!: ElementRef;
  public source = '';

  constructor(public injector: Injector,
    private route: ActivatedRoute) {
    this.route.queryParams.subscribe(params => {
      if (params['source']) {
        this.source = params['source'];
      }
    });
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    const el = this.container.nativeElement;

    if (el) {
      createEditor(el, this.injector, this.source);
    }
  }

}
