import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RangeSliderService {
  private alpha = 0.7 //default
  alphaSubject: BehaviorSubject<number> = new BehaviorSubject(this.alpha);
  constructor() { }

  getAlpha(): number {
    return this.alpha;
  }

  setAlpha(alpha: number) {
    this.alphaSubject.next(alpha);
  }
}
