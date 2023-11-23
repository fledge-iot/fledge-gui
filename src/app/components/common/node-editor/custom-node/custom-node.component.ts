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
import { SchedulesService } from "./../../../../services";
import { DocService } from "../../../../services/doc.service";

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
  helpText = '';
  isEnabled: boolean = false;
  service = {status:"", protocol:"", address:"", management_port:"", pluginName:""}

  @HostBinding("class.selected") get selected() {
    return this.data.selected;
  }

  constructor(private cdr: ChangeDetectorRef,
    private schedulesService: SchedulesService,
    private docService: DocService,
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
      // console.log(this.data.controls);
      // console.log(Object.keys(this.data.controls));
      this.service.management_port = Object.keys(this.data.controls)[0];
      this.service.status = Object.keys(this.data.controls)[1];
      this.service.protocol = Object.keys(this.data.controls)[2];
      this.service.address = Object.keys(this.data.controls)[3];
      this.service.pluginName = Object.keys(this.data.controls)[4];
      console.log(this.service);
      if(this.service.status === 'running'){
        this.isEnabled = true;
      }
      this.helpText = this.service.pluginName;
    }
    if(this.data.label === 'Filter'){
      this.data.label = Object.keys(this.data.controls)[0]
    }
    if(this.data.label === 'Applications'){
      this.helpText = 'Filters';
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
    this.router.navigate(['/south/add'], { queryParams: { source: 'flowEditor' } });
  }

  navToSouthService() {
    if (this.data.label === this.source) {
      this.router.navigate(['/south', this.source, 'details'], { queryParams: { source: 'flowEditor' } })
    }
    else if (this.data.label === 'Filter') {
      this.router.navigate(['/south', this.source, 'details'], { queryParams: { source: 'flowEditorFilter' } })
    }
    else {
      this.router.navigate(['/south', this.source, 'details'], { queryParams: { source: 'flowEditor' } })
    }
  }

  toggleEnabled(isEnabled){
    this.isEnabled = isEnabled;
    if(this.isEnabled){
      this.enableSchedule(this.source);
    }
    else{
      this.disableSchedule(this.source);
    }
  }

  public disableSchedule(serviceName) {
    this.schedulesService.disableScheduleByName(serviceName)
      .subscribe(
        () => {
          console.log("schedule disabled");
        },
        error => {
          console.log(error);
        });
  }

  public enableSchedule(serviceName) {
    this.schedulesService.enableScheduleByName(serviceName)
      .subscribe(
        () => {
          console.log("schedule enabled");
        },
        error => {
          console.log(error);
        });
  }

  goToLink(pluginInfo) {
    this.docService.goToPluginLink(pluginInfo);
  }
}
