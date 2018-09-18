import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-restart-modal',
  templateUrl: './restart-modal.component.html',
  styleUrls: ['./restart-modal.component.css']
})
export class RestartModalComponent implements OnInit {
  @Input() restartData: { key: any, message: any };
  @Output() restart = new EventEmitter<Number>();

  constructor() { }

  ngOnInit() { }

  public toggleModal(isOpen: Boolean) {
    const modalName = <HTMLDivElement>document.getElementById('restartModal-box');
    if (isOpen) {
      modalName.classList.add('is-active');
      return;
    }
    modalName.classList.remove('is-active');
  }


  triggerAction() {
    if (this.restartData.key === 'restart') {
      this.restart.emit();
      this.toggleModal(false);
    }
  }
}

