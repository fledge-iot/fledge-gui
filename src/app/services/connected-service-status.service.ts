import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Injectable()
export class ConnectedServiceStatus {
  private messageSource = new BehaviorSubject<boolean>(true);
  currentMessage = this.messageSource.asObservable();
  
  constructor() { }

  changeMessage(connectedServiceStatus: boolean) {
    this.messageSource.next(connectedServiceStatus)
  }
}
