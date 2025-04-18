import { Component, Input, SimpleChanges } from '@angular/core';
import { AlertService, ProgressBarService, ServicesApiService } from '../../../services';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, delay, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { Debug } from '../south/south-service';
import { DocService } from '../../../services/doc.service';

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

  showLoading = false;

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
    private docService: DocService,
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
  }

  ngAfterViewInit() {
    this.getBufferData();
  }

  ngOnChanges(chages: SimpleChanges) {
    if (chages['debuggerData']?.currentValue) {
      this.debuggerData = chages['debuggerData'].currentValue;
    }
    if (chages['serviceName']?.currentValue) {
      this.serviceName = chages['serviceName'].currentValue;
    }
  }

  showTooltip() {
    if (this.debuggerData.debug.egress == 'Isolated' && this.from == 'south') {
      return 'Egress data is isolated and not sent to storage.';
    } else if (this.debuggerData.debug.ingress == 'Suspended' && this.from == 'south') {
      return 'Ingestion at south from storage is currently paused.';
    }
    //  debuggerData.debug.ingress == 'Suspended' && from == 'south' ? 'Ingestion at south from storage is currently paused.' : 'Ingesting data'
  }

  toggleJsonView() {
    this.showRawJson = !this.showRawJson;
  }

  openReadtheDocs() {
    const slug = 'debugging-tracing-pipelines';
    this.docService.openDocsLink(slug);
  }

  toggleDebuggerState() {
    this.showLoading = true;
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
        if (action === 'attach') {
          setTimeout(() => {
            this.getService();
          }, 2000);
        } else {
          setTimeout(() => {
            this.showLoading = false;
            this.debuggerData = {
              debug: {
                debugger: '',
                ingress: '',
                egress: ''
              }, serviceName: this.serviceName
            }
          }, 2000)
        }
      }, error => {
        this.showLoading = false;
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
        this.tabData?.forEach(item => {
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

    return filtered;
  }

  executeStepSize() {
    // Step field changes
    const steps = this.formGroup.get('step')?.value;
    if (steps) {
      this.stepStatus = 'saving';
      const start = Date.now();
      this.southService.setStepSize(this.debuggerData.serviceName, { steps: +steps })
        .subscribe({
          next: () => {
            const elapsed = Date.now() - start;
            const minDisplayTime = 1000;
            const delay = Math.max(minDisplayTime - elapsed, 0);
            // some delay to ensure the success message is shown for at least 1 second
            setTimeout(() => {
              this.stepStatus = 'saved';
              setTimeout(() => this.stepStatus = 'idle', 3000);
            }, delay);
          },
          error: err => {
            this.stepStatus = 'idle';
            console.error('Step save failed:', err);
          }
        });
    }
  }

  getService() {
    this.southService.getSouthServices(true)
      .pipe(delay(3000))
      .subscribe((res) => {
        console.log(res);
        this.showLoading = false;
        const service = res['services'].find((service: any) => service.name === this.debuggerData.serviceName);
        this.debuggerData = { debug: service.debug, serviceName: service.name };
        console.log(this.debuggerData);
      }, error => {
        this.showLoading = false;
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText, true);
        }
      });
  }
}

