import { Directive, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appRestrictSpecialChar]'
})
export class RestrictSpecialCharDirective {
  @Input() restrictedChars: any[];

  constructor() { }

  @HostListener('keypress') onkeypress(e) {
    const event = e || window.event;
    if (event) {
      return this.isRestrictedChar(event);
    }
  }

  isRestrictedChar(event) {
    if (!this.restrictedChars) {
      this.restrictedChars = ['34'];
    }
    const charCode = (event.which) ? event.which : event.keyCode;
    return !this.restrictedChars.includes(charCode);
  }
}
