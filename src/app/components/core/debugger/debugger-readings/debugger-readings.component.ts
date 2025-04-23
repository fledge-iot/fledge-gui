import { Component, Input } from '@angular/core';
import { Debug } from '../../south/south-service';

@Component({
  selector: 'debugger-readings',
  templateUrl: './debugger-readings.component.html',
  styleUrls: ['./debugger-readings.component.css']
})
export class DebuggerReadingsComponent {
  @Input() serviceName = '';
  @Input() debuggerData: { debug: Debug, serviceName: string, node?: string };
  @Input() node: string;

  bufferData;
  activeTabIndex = 0;
  accordionItems: any[] = [];
  branchItems: any[];
  writerItems: any[];
  bufferDataExist = false;
  showRawJson = false;

  constructor() { }

  toggleJsonView() {
    this.showRawJson = !this.showRawJson;
  }

  // Use arrow function to retain `this` context
  handleEscapeKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      this.toggleModal(false);
    }
  }

  public toggleModal(isOpen: boolean) {
    const modalName = <HTMLDivElement>document.getElementById('debugger-readings-box');
    if (isOpen) {
      window.addEventListener('keydown', this.handleEscapeKey);
      modalName.classList.add('is-active');
      return;
    }
    modalName.classList.remove('is-active');
    window.removeEventListener('keydown', this.handleEscapeKey);
  }

  ngOnDestroy() {
    // Clean up listener when component is destroyed
    window.removeEventListener('keydown', this.handleEscapeKey);
  }

}
