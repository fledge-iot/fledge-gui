import {
  Component,
  Input,
  HostBinding,
  ChangeDetectorRef,
  OnChanges
} from "@angular/core";
import { ClassicPreset } from "rete";
import { KeyValue } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
  selector: 'app-custom-node',
  templateUrl: './custom-node.component.html',
  styleUrls: ['./custom-node.component.css'],
  host: {
    "data-testid": "node"
  }
})
export class CustomNodeComponent implements OnChanges {

  @Input() data!: ClassicPreset.Node;
  @Input() emit!: (data: any) => void;
  @Input() rendered!: () => void;

  seed = 0;
  public source = '';

  @HostBinding("class.selected") get selected() {
    return this.data.selected;
  }

  constructor(private cdr: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute) {
    this.cdr.detach();
    this.route.queryParams.subscribe(params => {
      if (params['source']) {
        this.source = params['source'];
      }
    });
  }

  ngOnChanges(): void {
    if(this.data.label === 'South_service' && this.source !== ''){
      this.data.label = this.source;
    }
    if(this.data.label === 'Filter'){
      this.data.label = Object.keys(this.data.controls)[0]
    }
    this.cdr.detectChanges();
    requestAnimationFrame(() => this.rendered());
    this.seed++; // force render sockets
  }

  sortByIndex<
    N extends object,
    T extends KeyValue<string, N & { index?: number }>
  >(a: T, b: T) {
    const ai = a.value.index || 0;
    const bi = b.value.index || 0;

    return ai - bi;
  }

  addSouthService() {
    if(this.data.label === 'South_service'){
      this.router.navigate(['/south/add'], { queryParams: { source: 'flowEditor' } });
    }
    else if(this.data.label === this.source){
      this.router.navigate(['/south', this.source, 'details'], { queryParams: { source: 'flowEditor' } })
    }
    else if(this.data.label === 'Filter'){
      this.router.navigate(['/south', this.source, 'details'], { queryParams: { source: 'flowEditorFilter' } })
    }
    else{
      this.router.navigate(['/south', this.source, 'details'], { queryParams: { source: 'flowEditor' } })
    }
  }
}
