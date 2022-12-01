import { Directive, ElementRef, OnChanges } from '@angular/core';
import { RolesService } from '../services/roles.service';

@Directive({
  selector: '[requiredEditorRole]'
})
export class AccessControlDirective implements OnChanges {
  constructor(
    private rolesService: RolesService,
    private elRef: ElementRef
  ) {
    this.validateAccess();
  }

  ngOnChanges(): void {
    this.validateAccess();
  }

  private validateAccess(): void {
    console.log('access', this.rolesService.hasEditorRole());

    if (!this.rolesService.hasEditorRole() && this.elRef.nativeElement) {
      // remove action element from DOM for view and data_view user
      this.elRef.nativeElement.remove();
    }
  }
}
