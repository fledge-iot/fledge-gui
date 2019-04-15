import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-shutdown-modal',
  templateUrl: './shutdown-modal.component.html',
  styleUrls: ['./shut-down.component.css']
})
export class ShutdownModalComponent implements OnInit {
  @Input() shutDownData: { key: any, message: any };
  @Output() shutdown = new EventEmitter<Number>();

  constructor() { }

  ngOnInit() { }

  public toggleModal(isOpen: Boolean) {
    const modal_name = <HTMLDivElement>document.getElementById('shutdownModal-box');
    if (isOpen) {
      modal_name.classList.add('is-active');
      return;
    }
    modal_name.classList.remove('is-active');
  }


  triggerAction() {
    if (this.shutDownData.key === 'shutdown') {
      this.shutdown.emit();
      this.toggleModal(false);
    }
  }
}
