import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AlertService, ProgressBarService, ServicesApiService } from '../../../services';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

export interface Debug {
  debugger: string
  ingress: string
  egress: string
}


@Component({
  selector: 'app-debugger',
  templateUrl: './debugger.component.html',
  styleUrls: ['./debugger.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DebuggerComponent {
  @Input() debuggerData: { debug: Debug, serviceName: string };
  @Input() serviceName: string;
  @Input() from: string;

  formGroup: FormGroup;

  constructor(
    private southService: ServicesApiService,
    private ngProgress: ProgressBarService,
    private alertService: AlertService,
    private fb: FormBuilder

  ) { }

  ngOnInit() {
    console.log('debugger component', this.debuggerData);
    console.log('from', this.from);
    this.formGroup = this.fb.group({
      buffer: [''],
      step: ['']
    });

    // Buffer field changes
    this.formGroup.get('buffer')!.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(value => this.southService.setBufferSize(this.debuggerData.serviceName, { size: +value }))
      )
      .subscribe({
        next: response => console.log('Buffer saved:', response),
        error: err => console.error('Buffer save failed:', err)
      });

    // Step field changes
    this.formGroup.get('step')!.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(value => this.southService.setStepSize(this.debuggerData.serviceName, { steps: +value }))
      )
      .subscribe({
        next: response => console.log('Step saved:', response),
        error: err => console.error('Step save failed:', err)
      });
  }

  toggleDebuggerState() {
    this.ngProgress.start();
    const name = this.debuggerData.serviceName;
    const action = this.debuggerData.debug.debugger === 'Attached' ? 'detach' : 'attach';
    this.southService.manageServiceDebuggerState(name, action)
      .subscribe((res) => {
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
        console.log(res);

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
}

