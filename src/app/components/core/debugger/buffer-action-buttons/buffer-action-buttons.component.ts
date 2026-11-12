import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { RolesService } from '../../../../services';

@Component({
    selector: 'buffer-action-buttons',
    templateUrl: './buffer-action-buttons.component.html',
    styleUrls: ['./buffer-action-buttons.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class BufferActionButtonsComponent {
  onReplay() {
    throw new Error('Method not implemented.');
  }
  @Input() formGroup!: FormGroup;
  @Input() bufferStatus!: string;
  @Input() stepStatus!: string;
  @Input() step!: any; // Change type if needed
  @Input() setSteps!: () => void;

  constructor(public rolesService: RolesService) { }
}
