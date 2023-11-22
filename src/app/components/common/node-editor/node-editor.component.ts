import { Component, ElementRef, Injector, OnInit, ViewChild } from '@angular/core';
import { createEditor } from './editor';
import { ActivatedRoute } from '@angular/router';
import { FilterService } from './../../../services';

@Component({
  selector: 'app-node-editor',
  templateUrl: './node-editor.component.html',
  styleUrls: ['./node-editor.component.css']
})
export class NodeEditorComponent implements OnInit {

  @ViewChild("rete") container!: ElementRef;
  public source = '';
  public filterPipeline: string[] = [];

  constructor(public injector: Injector,
    private route: ActivatedRoute,
    private filterService: FilterService,) {
    this.route.queryParams.subscribe(params => {
      if (params['source']) {
        this.source = params['source'];
        this.getFilterPipeline();
      }
    });
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    const el = this.container.nativeElement;

    if (el) {
      setTimeout(() => {
        createEditor(el, this.injector, this.source, this.filterPipeline);
      }, 100);
    }
  }

  getFilterPipeline() {
    this.filterService.getFilterPipeline(this.source)
      .subscribe((data: any) => {
        this.filterPipeline = data.result.pipeline as string[];
      },
        error => {
          if (error.status === 404) {
            this.filterPipeline = [];
          } else {
            console.log('Error ', error);
          }
        });
  }

}
