import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RangeSliderService {
  private alpha = 1 //default
  alphaSubject: BehaviorSubject<number> = new BehaviorSubject(this.alpha);
  constructor() { }

  public getAlpha(): number {
    return this.alpha;
  }

  public setAlpha(alpha: number) {
    this.alphaSubject.next(alpha);
  }

  public alphaControl(visible: boolean) {
    localStorage.setItem('ALPHA_CONTROL', JSON.stringify(visible));
  }

  public getAlphControlStatus(): boolean {
    const controlStatus: boolean = JSON.parse(localStorage.getItem('ALPHA_CONTROL'));
    return controlStatus ? controlStatus : false;
  }

}
