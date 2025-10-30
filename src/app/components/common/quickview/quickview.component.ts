import { Component, HostListener, Input, OnInit, ViewChild, ContentChild } from '@angular/core';
import { FlowEditorService } from './../node-editor/flow-editor.service';
import { SharedService } from 'src/app/services/shared.service';

declare const bulmaQuickview: any;

@Component({
  selector: 'app-quickview',
  templateUrl: './quickview.component.html',
  styleUrls: ['./quickview.component.css']
})
export class QuickviewComponent implements OnInit {

  @ViewChild('quickView') quickView;
  @ViewChild('quickViewBlock') quickViewBlock;
  @Input() showReadings: boolean;
  @Input() isDebuggerPage = false;
  @Input() showLogs: boolean;

  @ContentChild('notificationLogs', { static: false }) notificationLogsComponent;
  @ContentChild('systemLogs', { static: false }) systemLogsComponent;

  constructor(
    public flowEditorService: FlowEditorService,
    public sharedService: SharedService
  ) { }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    this.onCloseQuickview();
  }

  ngOnInit(): void {
    // this is a work around to attach quickview component after the data is loaded in child component (which is rendered through ng-content)
    let count = 0;
    let intervalId = setInterval(() => {
      bulmaQuickview.attach();
      count++;
      if (count == 100) {
        clearInterval(intervalId)
      }
    }, 100)
  }

  ngOnChanges() {
    if (this.isDebuggerPage && this.quickView) {
      this.quickView.nativeElement.style.width = '35%';
      return;
    }
    if (this.showReadings) {
      this.quickView.nativeElement.style.width = '35%';
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
    this.quickView.nativeElement.classList.remove('is-active');
    this.flowEditorService.showLogsInQuickview.next({ showLogs: false });
    this.flowEditorService.openDebuggerInQuickview.next({ openDebuggerPage: false });
    if (this.notificationLogsComponent) {
      this.notificationLogsComponent.ngOnDestroy();
    }
    if (this.systemLogsComponent) {
      this.systemLogsComponent.ngOnDestroy();
    }

    // set the list kv view to the default value on close quickview
    if (this.sharedService.listKvView) {
      const view = localStorage.getItem('LIST_KVLIST_VIEW') || 'list';
      this.sharedService.listKvView.next(view);
    }
  }

  ngOnDestroy() {
    this.onCloseQuickview();
  }
}
