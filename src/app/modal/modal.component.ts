import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import { SchedulesService, AlertService } from '../services/index';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html'
})
export class ModalComponent implements OnInit {
  @Input() childData: { id: Number, name: any };
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();

  constructor(private schedulesService: SchedulesService, private alertService: AlertService) { }

  ngOnInit() { }

  public toggleModal(isOpen: Boolean) {
    let schedule_name = <HTMLDivElement>document.getElementById('modal-box');
    if (isOpen) {
      schedule_name.classList.add('is-active');
      return;
    }
    schedule_name.classList.remove('is-active');
  }

  /**
   *  Delete schedule
   */
  public delete() {
    this.schedulesService.deleteSchedule(this.childData.id).
      subscribe(
      data => {
        if (data.error) {
          console.log('error in response', data.error);
          this.alertService.error(data.error.message);
          return;
        }
        this.toggleModal(false);
        this.notify.emit();
        this.alertService.success('Schedule deleted successfully');
      },
      error => { console.log('error', error); });
  }
}
