import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FlowEditorService {

  public showItemsInQuickview: BehaviorSubject<any> = new BehaviorSubject<any>(false);
  public filterInfo: BehaviorSubject<any> = new BehaviorSubject<any>(false);
  public pipelineInfo: BehaviorSubject<any> = new BehaviorSubject<any>(false);
  public connectionInfo: BehaviorSubject<any> = new BehaviorSubject<any>(false);
  public canvasClick: BehaviorSubject<any> = new BehaviorSubject<any>(false);
  constructor() { }
}
