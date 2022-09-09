import { Component, ElementRef, HostListener, Input, OnInit, ViewChild } from '@angular/core';
import { DialogService } from './dialog.service';

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.css']
})
export class ConfirmationDialogComponent implements OnInit {

  @Input() id: string;
  private element: any;
  @ViewChild('confirmationDialog', { static: true }) confirmationDialog: ElementRef;

  constructor(private dialogService: DialogService) { }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    const alertModal = <HTMLDivElement>document.getElementById(this.id);
    if (!alertModal.classList.contains('is-active')) {
      this.toggleModal(false);
    }
  }

  ngOnInit(): void {
    this.element = this.confirmationDialog.nativeElement;
    // ensure id attribute exists
    if (!this.id) {
      console.error('modal must have an id');
      return;
    }

    // add self (this modal instance) to the modal service so it's accessible from controllers
    this.dialogService.add(this);
  }

  // remove self from modal service when component is destroyed
  ngOnDestroy(): void {
    this.dialogService.remove(this.id);
    this.element.remove();
  }

  // open modal
  open(): void {
    this.toggleModal(true);
  }

  // close modal
  close(): void {
    this.toggleModal(false);
  }

  public toggleModal(isOpen: Boolean) {
    if (isOpen) {
      this.element.classList.add('is-active');
      return;
    }
    this.element.classList.remove('is-active');
  }
}
