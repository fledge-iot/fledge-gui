import { EventEmitter, Injectable, Output } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  private modals: any[] = [];
  @Output() resetChangesEmitter: EventEmitter<boolean>;

  add(modal: any) {
    // add modal to array of active modals
    this.modals.push(modal);
  }

  remove(id: string) {
    // remove modal from array of active modals
    this.modals = this.modals.filter(x => x.id !== id);
  }

  open(id: string) {
    // open modal specified by id
    const modal = this.modals.find(x => x.id === id);
    modal.open();
  }

  close(id: string) {
    // close modal specified by id
    const modal = this.modals.find(x => x.id === id);
    modal?.close();
  }

  // unsave changes dialog
  confirm(data: { id: string, changeExist: boolean }): Observable<boolean> {
    if (data.changeExist == true) {
      this.resetChangesEmitter = new EventEmitter();
      this.open(data.id);
      this.resetChangesEmitter.emit(false);
      return this.resetChangesEmitter;
    }
    else {
      this.resetChangesEmitter?.emit(true);
      this.resetChangesEmitter?.complete();
      return of(true)
    }
  }
}
