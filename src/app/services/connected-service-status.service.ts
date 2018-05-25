import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Injectable()
export class ConnectedServiceStatus {
  private messageSource = new BehaviorSubject<boolean>(false);
  currentMessage = this.messageSource.asObservable();

  constructor() { }

  changeMessage(connectedServiceStatus: boolean) {
    this.messageSource.next(connectedServiceStatus);
  }
}
