import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, SimpleChanges, OnInit } from '@angular/core';

@Component({
    selector: 'app-validation-report',
    templateUrl: './validation-report.component.html',
    styleUrls: ['./validation-report.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class ValidationReportComponent implements OnInit {
  @Input() results: any;
  @Input() loading: boolean = false;
  @Input() error: string | null = null;
  @Output() close = new EventEmitter<void>();

  public expandedTests: { [key: string]: boolean } = {};
  public minimized = false;
  
  // Report icon state object
  public reportIcon = {
    classes: 'bi bi-ui-checks',
    tooltip: 'Validation status'
  };

  ngOnInit(): void {
    this.updateIconState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['results'] || changes['loading'] || changes['error']) {
      this.updateIconState();
    }
  }

  public toggleReport(key: string) {
    this.expandedTests[key] = !this.expandedTests[key];
  }

  public toggleMinimize() {
    this.minimized = !this.minimized;
  }

  public onClose() {
    this.close.emit();
  }

  /**
   * Update icon state based on current validation results
   * This method is called only when inputs change, not on every change detection
   */
  private updateIconState(): void {
    const state = this.getValidationState();
    
    const baseClass = 'bi bi-ui-checks';
    
    // Update reportIcon object based on validation state
    switch (state) {
      case 'loading':
        this.reportIcon = {
          classes: `${baseClass} has-text-primary blink`,
          tooltip: 'Running validation checks...'
        };
        break;
      case 'success':
        this.reportIcon = {
          classes: `${baseClass} has-text-success`,
          tooltip: 'All checks passed'
        };
        break;
      case 'danger':
        this.reportIcon = {
          classes: `${baseClass} has-text-danger`,
          tooltip: 'All checks failed'
        };
        break;
      case 'error':
        this.reportIcon = {
          classes: `${baseClass} has-text-danger`,
          tooltip: 'Validation error occurred'
        };
        break;
      case 'warning':
        this.reportIcon = {
          classes: `${baseClass} has-text-warning`,
          tooltip: 'Some checks failed'
        };
        break;
      default:
        this.reportIcon = {
          classes: baseClass,
          tooltip: 'Validation status'
        };
    }
  }

  /**
   * Get the validation state based on results
   * @returns The current validation state
   */
  private getValidationState(): 'loading' | 'success' | 'danger' | 'warning' | 'error' {
    if (this.loading) {
      return 'loading';
    }
    
    if (this.error) {
      return 'error';
    }
    
    if (!this.results) {
      return 'loading';
    }
    
    const resultEntries = Object.values(this.results);
    if (resultEntries.length === 0) {
      return 'loading';
    }
    
    const passedTests = resultEntries.filter((result: any) => result?.result === 'pass').length;
    const failedTests = resultEntries.filter((result: any) => result?.result === 'fail').length;
    const totalTests = resultEntries.length;
    
    if (passedTests === totalTests) {
      return 'success';
    } else if (failedTests === totalTests) {
      return 'danger';
    } else {
      return 'warning';
    }
  }
}


