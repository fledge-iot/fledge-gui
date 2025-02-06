import { Component, HostListener, Input, OnInit, ViewChild, ContentChild } from '@angular/core';
import * as bulmaQuickview from './../../../../../node_modules/bulma-quickview/dist/js/bulma-quickview.min.js'
import { FlowEditorService } from './../node-editor/flow-editor.service';

@Component({
  selector: 'app-quickview',
  templateUrl: './quickview.component.html',
  styleUrls: ['./quickview.component.css']
})
export class QuickviewComponent implements OnInit {

  @ViewChild('quickView') quickView;
  @ViewChild('quickViewBlock') quickViewBlock;
  @Input() showReadings: boolean;
  @Input() showLogs: boolean;

  @ContentChild('notificationLogs', { static: false }) notificationLogsComponent;
  @ContentChild('systemLogs', { static: false }) systemLogsComponent;

  constructor(
    public flowEditorService: FlowEditorService,
  ) { }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    this.quickView.nativeElement.classList.remove('is-active');
    this.onCloseQuickview();
  }



  ngOnInit(): void {
    // this is a work around to attach quickview component after the data is loaded in child component (which is rendered through ng-content)
    var count = 0;
    let intervalId = setInterval(() => {
      bulmaQuickview.attach();
      count++;
      if (count == 100) {
        clearInterval(intervalId)
      }
    }, 100)
  }

  ngOnChanges() {
    if (this.showReadings) {
      this.quickView.nativeElement.style.width = '35%';
      this.quickViewBlock.nativeElement.style.width = '80%';
      return;
    }
    if (this.quickView) {
      this.quickView.nativeElement.style.width = '66%';
      this.quickViewBlock.nativeElement.style.width = '95%';
    }
    if (this.showLogs) {
      if (this.notificationLogsComponent) {
        this.notificationLogsComponent.ngOnInit();
      }
      if (this.systemLogsComponent) {
        this.systemLogsComponent.ngOnInit();
      }
    }
  }

  onCloseQuickview() {
    this.flowEditorService.showLogsInQuickview.next({ showLogs: false });
    if (this.notificationLogsComponent) {
      this.notificationLogsComponent.ngOnDestroy();
    }
    if (this.systemLogsComponent) {
      this.systemLogsComponent.ngOnDestroy();
    }
  }

  ngOnDestroy() {
    this.onCloseQuickview();
  }
}
