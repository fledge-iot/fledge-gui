import { Injectable } from '@angular/core';
import { NgProgress, NgProgressRef } from '@ngx-progressbar/core';

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
}
