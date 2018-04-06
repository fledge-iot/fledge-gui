import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Injectable()
export class PingService {
  isPingIntervalChanged: BehaviorSubject<boolean> = new BehaviorSubject(false);
  constructor() { }
}
