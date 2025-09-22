import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-validation-report',
  templateUrl: './validation-report.component.html',
  styleUrls: ['./validation-report.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ValidationReportComponent {
  @Input() results: any;
  @Input() loading: boolean = false;
  @Input() error: string | null = null;
  @Output() close = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges): void {
    
    if (changes['results']) {
     
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

  /**
   * Get the validation state based on results
   * @returns The current validation state
   */
  public getValidationState(): 'loading' | 'success' | 'danger' | 'warning' | 'error' {
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

  /**
   * Get the icon classes based on validation state
   * @returns CSS classes for the validation icon
   */
  public getIconClasses(): string {
    const state = this.getValidationState();
    const baseClass = 'bi bi-ui-checks';
    
    switch (state) {
      case 'loading':
        return `${baseClass} has-text-primary blink`;
      case 'success':
        return `${baseClass} has-text-success`;
      case 'danger':
      case 'error':
        return `${baseClass} has-text-danger`;
      case 'warning':
        return `${baseClass} has-text-warning`;
      default:
        return baseClass;
    }
  }

  /**
   * Get the tooltip text based on validation state
   * @returns Tooltip text for the validation icon
   */
  public getIconTooltip(): string {
    const state = this.getValidationState();
    
    switch (state) {
      case 'loading':
        return 'Running validation checks...';
      case 'success':
        return 'All checks passed';
      case 'danger':
        return 'All checks failed';
      case 'error':
        return 'Validation error occurred';
      case 'warning':
        return 'Some checks failed';
      default:
        return 'Validation status';
    }
  }
}


