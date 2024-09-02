import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FlowEditorService {

  public showItemsInQuickview: BehaviorSubject<any> = new BehaviorSubject<any>(false);
  public showLogsInQuickview: BehaviorSubject<any> = new BehaviorSubject<any>(false);
  public filterInfo: BehaviorSubject<any> = new BehaviorSubject<any>(false);
  public pipelineInfo: BehaviorSubject<any> = new BehaviorSubject<any>(false);
  public connectionInfo: BehaviorSubject<any> = new BehaviorSubject<any>(false);
  public showAddFilterIcon: BehaviorSubject<any> = new BehaviorSubject<any>(false);
  public serviceInfo: BehaviorSubject<any> = new BehaviorSubject<any>(false);
  public removeFilter: BehaviorSubject<any> = new BehaviorSubject<any>(false);
  public exportReading: BehaviorSubject<any> = new BehaviorSubject<any>(false);
  public nodeClick: BehaviorSubject<any> = new BehaviorSubject<any>(false);
  constructor() { }

  public flowEditorControl(visible: boolean) {
    localStorage.setItem('FLOW_EDITOR', JSON.stringify(visible));
  }

  public getFlowEditorStatus(): boolean {
    const controlStatus: boolean = JSON.parse(localStorage.getItem('FLOW_EDITOR'));
    return controlStatus ? controlStatus : false;
  }
}
