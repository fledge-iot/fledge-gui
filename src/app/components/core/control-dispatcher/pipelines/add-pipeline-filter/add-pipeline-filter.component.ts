import {
  Component, EventEmitter, HostListener, Input, OnInit, Output
} from '@angular/core';

@Component({
  selector: 'app-add-pipeline-filter-modal',
  templateUrl: './add-pipeline-filter.component.html',
  styleUrls: ['./add-pipeline-filter.component.css']
})
export class AddPipelineFilterComponent implements OnInit {
  @Input() pipelineName: any;
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();

  filterData: any;

  constructor() { }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    const alertModal = <HTMLDivElement>document.getElementById('modal-box');
    if (!alertModal.classList.contains('is-active')) {
      this.toggleModal(false);
    }
  }

  ngOnInit() { }

  public toggleModal(isOpen: Boolean) {
    const modalWindow = <HTMLDivElement>document.getElementById('pipeline-filter-modal');
    if (isOpen) {  
      this.notify.emit(this.filterData);
      modalWindow.classList.add('is-active');
      return;
    } 
    this.notify.emit(this.filterData);
    modalWindow.classList.remove('is-active');
  }

  onNotify(data) {
    this.filterData = data;
    this.toggleModal(false);
  }
}