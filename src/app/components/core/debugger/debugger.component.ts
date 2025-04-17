import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { AlertService, ProgressBarService, ServicesApiService } from '../../../services';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { Debug } from '../south/south-service';

@Component({
  selector: 'app-debugger',
  templateUrl: './debugger.component.html',
  styleUrls: ['./debugger.component.css']
})
export class DebuggerComponent {
  @Input() debuggerData: { debug: Debug, serviceName: string };
  @Input() serviceName: string;
  @Input() from: string;

  showRawJson = false;

  bufferDataExist = false;

  formGroup: FormGroup;

  tabData = [];
  activeTabIndex = 0;

  tabs = ['All', 'Branches', 'Writer'];

  tabNameMap: { [key: string]: string } = {
    'All': 'All',
    'Branches': 'Branch',
    'Writer': 'Writer'
    // Add more mappings here if needed
  };

  accordionItems: any[] = [];

  bufferStatus: 'idle' | 'saving' | 'saved' = 'idle';
  stepStatus: 'idle' | 'saving' | 'saved' = 'idle';

  branchItems: any[] = [];
  writerItems: any[] = [];

  constructor(
    private southService: ServicesApiService,
    private ngProgress: ProgressBarService,
    private alertService: AlertService,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    this.formGroup = this.fb.group({
      buffer: [''],
      step: ['']
    });

    // Buffer field changes
    this.formGroup.get('buffer')!.valueChanges
      .pipe(
        tap(() => this.bufferStatus = 'saving'),
        debounceTime(2000),
        distinctUntilChanged(),
        switchMap(value => this.southService.setBufferSize(this.debuggerData.serviceName, { size: +value }))
      )
      .subscribe({
        next: () => {
          this.bufferStatus = 'saved';
          setTimeout(() => this.bufferStatus = 'idle', 2000); // Clear status after 2s
        },
        error: err => {
          this.bufferStatus = 'idle';
          console.error('Buffer save failed:', err);
        }
      });

    // Step field changes
    this.formGroup.get('step')!.valueChanges
      .pipe(
        tap(() => this.stepStatus = 'saving'),
        debounceTime(2000),
        distinctUntilChanged(),
        switchMap(value => this.southService.setStepSize(this.debuggerData.serviceName, { steps: +value }))
      )
      .subscribe({
        next: () => {
          this.stepStatus = 'saved';
          setTimeout(() => this.stepStatus = 'idle', 2000);
        },
        error: err => {
          this.stepStatus = 'idle';
          console.error('Step save failed:', err);
        }
      });
  }

  ngAfterViewInit() {
    this.getBufferData();
  }

  toggleJsonView() {
    this.showRawJson = !this.showRawJson;
  }

  toggleDebuggerState() {
    this.ngProgress.start();
    const name = this.debuggerData.serviceName;
    const action = this.debuggerData.debug.debugger === 'Attached' ? 'detach' : 'attach';
    this.southService.manageServiceDebuggerState(name, action)
      .subscribe((res) => {
        if (action === 'attach') {
          this.debuggerData.debug.debugger = 'Attached';
        } else {
          this.debuggerData.debug.debugger = 'Detached';
        }
        this.ngProgress.done();
        this.alertService.success(res['message'], true);
      }, error => {
        this.ngProgress.done();
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText, true);
        }
      });
  }

  toggleEgressState() {
    this.ngProgress.start();
    const name = this.debuggerData.serviceName;
    const action = 'isolate';
    let payload = {};
    if (this.debuggerData.debug.egress !== 'Isolated') {
      payload = { state: 'discard' }
    } else {
      payload = { state: 'store' }
    }
    this.southService.manageServiceDebuggerState(name, action, payload)
      .subscribe((res) => {
        this.debuggerData.debug.egress = payload['state'] === 'discard' ? 'Isolated' : 'Storage';
        this.ngProgress.done();
        this.alertService.success(res['message'], true);
      }, error => {
        this.ngProgress.done();
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText, true);
        }
      });
  }

  toggleIngressState() {
    this.ngProgress.start();
    const name = this.debuggerData.serviceName;
    let action = 'suspend';
    let payload = {};
    if (this.debuggerData.debug.ingress !== 'Running') {
      payload = { state: 'resume' }
    } else {
      payload = { state: 'suspend' }
    }

    this.southService.manageServiceDebuggerState(name, action, payload)
      .subscribe((res) => {
        this.debuggerData.debug.ingress = payload['state'] === 'resume' ? 'Running' : 'Suspended';
        this.ngProgress.done();
        this.alertService.success(res['message'], true);
      }, error => {
        this.ngProgress.done();
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText, true);
        }
      });
  }

  replayBuffer() {
    this.ngProgress.start();
    const name = this.debuggerData.serviceName;
    let action = 'replay';
    this.southService.manageServiceDebuggerState(name, action)
      .subscribe((res) => {
        this.ngProgress.done();
        this.alertService.success(res['message'], true);
        this.getBufferData();
      }, error => {
        this.ngProgress.done();
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText, true);
        }
      });
  }

  toggleItem(index: number) {
    const filteredItems = this.getItemsForActiveTab();
    const selectedItem = filteredItems[index];

    this.accordionItems = this.accordionItems.map(item => {
      if (item === selectedItem) {
        return { ...item, isOpen: !item.isOpen };
      } else {
        return { ...item, isOpen: false };
      }
    });
  }

  getBufferData() {
    this.ngProgress.start();
    const name = this.debuggerData.serviceName;
    this.southService.getBufferedData(name)
      .subscribe((res) => {
        this.tabData = res['data'];
        this.ngProgress.done();
        const flatList: any[] = [];
        this.tabData.forEach(item => {
          if (Array.isArray(item)) {
            item.forEach(child => flatList.push(child));
          } else {
            flatList.push(item);
          }
        });

        // Store the normalized data with open states
        this.accordionItems = flatList.map((item, index) => ({
          ...item,
          isOpen: false
        }));

        this.branchItems = this.accordionItems.filter(item =>
          item.name?.toLowerCase().includes('branch')
        );

        this.writerItems = this.accordionItems.filter(item =>
          item.name?.toLowerCase().includes('writer')
        );
      }, error => {
        this.ngProgress.done();
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText, true);
        }
      });
  }

  getReadingKeys(reading: Record<string, any>): string[] {
    return Object.keys(reading);
  }

  getItemsForActiveTab(): any[] {
    if (this.activeTabIndex === 1) {
      return this.accordionItems.filter(item =>
        item.name?.toLowerCase().includes('branch')
      );
    }
    if (this.activeTabIndex === 2) {
      return this.accordionItems.filter(item =>
        item.name?.toLowerCase().includes('writer')
      );
    }
    return this.accordionItems;
  }

  viewBufferData() {
    if (this.accordionItems.length > 0) {
      this.bufferDataExist = true;
    } else {
      this.bufferDataExist = false;
    }
  }

  getFilteredJsonForActiveTab(): any {
    const currentTab = this.tabs[this.activeTabIndex];
    const filterName = this.tabNameMap[currentTab];

    if (!filterName || filterName === 'All') {
      return this.tabData;
    }

    // Flatten and filter
    const flatData = this.tabData?.flatMap((entry: any) =>
      Array.isArray(entry) ? entry : [entry]
    );

    const filtered = flatData.filter((item: any) =>
      item.name?.toLowerCase() === filterName.toLowerCase()
    );

    return { data: filtered };
  }


}

