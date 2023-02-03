import { Directive, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appRestrictSpecialChar]'
})
export class RestrictSpecialCharDirective {
  @Input() restrictedCharCode: any[];

  constructor() { }

  @HostListener('keypress') onkeypress(e) {
    const event = e || window.event;
    if (event) {
      return this.isRestrictedChar(event);
    }
  }

  isRestrictedChar(event) {
    if (this.restrictedCharCode.length === 0) {
      this.restrictedCharCode = ['34'];
    }
    const charCode = (event.which) ? event.which : event.keyCode;
    return !this.restrictedCharCode.includes(charCode);
  }
}
