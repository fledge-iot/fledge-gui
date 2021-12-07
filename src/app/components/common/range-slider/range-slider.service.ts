import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RangeSliderService {
  opacitySubject: BehaviorSubject<number> = new BehaviorSubject(0.5);
  constructor() { }


  setOpacity(opacity: number) {
    this.opacitySubject.next(opacity);
  }
}
