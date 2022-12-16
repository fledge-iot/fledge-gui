import { Directive, ElementRef, OnChanges } from '@angular/core';
import { Subject } from 'rxjs';

@Directive({
  selector: '[requiredViewEditorRole]'
})
export class AccessControlDirective implements OnChanges {

  destroy$: Subject<boolean> = new Subject<boolean>();
  constructor(
    private elRef: ElementRef
  ) {
    this.validateAccess();
  }

  ngOnChanges(): void {
    this.validateAccess();
  }

  private validateAccess(): void {
    const roleId = Number(sessionStorage.getItem('roleId'));
    if (roleId === 4) {  // 4 = data_view role
      // remove sidebar action items from DOM for data_view user
      this.elRef.nativeElement.remove();
    }
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
