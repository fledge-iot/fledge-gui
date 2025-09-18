import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';

@Component({
    selector: 'app-validation-report',
    templateUrl: './validation-report.component.html',
    styleUrls: ['./validation-report.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class ValidationReportComponent {
  @Input() results: any;
  @Input() loading: boolean = false;
  @Input() error: string | null = null;
  @Output() close = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges): void {
    console.log(changes);
    if (changes['results']) {
      console.log(this.results);
      this.results = changes['results'].currentValue;
    }
  }

  public expandedTests: { [key: string]: boolean } = {};
  public minimized = false;

  public toggleReport(key: string) {
    this.expandedTests[key] = !this.expandedTests[key];
  }

  public toggleMinimize() {
    this.minimized = !this.minimized;
  }

  public onClose() {
    this.close.emit();
  }
}


