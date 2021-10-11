import { Injectable } from '@angular/core';
import { NgProgress, NgProgressRef } from 'ngx-progressbar';

@Injectable({
  providedIn: 'root'
})
export class ProgressBarService {
  private progressRef: NgProgressRef;

  constructor(public ngProgress: NgProgress) {
    this.progressRef = this.ngProgress.ref();
  }

  start() {
    this.progressRef.start();
  }

  done() {
    this.progressRef.complete();
  }

  set(n?:number) {
    this.progressRef.set(n);
  }

  inc(amount?:number) {
    this.progressRef.inc(amount);
  }
}
