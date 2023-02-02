import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[appRestrictDoubleQuote]'
})
export class RestrictDoubleQuoteDirective {

  constructor() { }

  @HostListener('keypress') onkeypress(e) {
    const event = e || window.event;
    if (event) {
      return this.isDoubleQuote(event);
    }
  }

  isDoubleQuote(event) {
    const charCode = (event.which) ? event.which : event.keyCode;
    console.log('appRestrictDoubleQuote', charCode);
    if (charCode === 34) {
      return false;
    }
    return true;
  }
}
