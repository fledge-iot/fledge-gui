import { Directive, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appRestrictSpecialChars]'
})
export class RestrictSpecialCharDirective {
  @Input() restrictedCharCodes: any[];

  constructor() { }

  @HostListener('keypress') onkeypress(e) {
    const event = e || window.event;
    if (event) {
      return this.isRestrictedChar(event);
    }
  }

  isRestrictedChar(event) {
    if (this.restrictedCharCodes?.length === 0) {
      this.restrictedCharCodes = ['34'];
    }
    const charCode = (event.which) ? event.which : event.keyCode;
    return !this.restrictedCharCodes?.includes(charCode);
  }
}
