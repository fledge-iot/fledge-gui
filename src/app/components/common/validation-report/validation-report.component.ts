import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

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


