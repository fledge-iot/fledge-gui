import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[appIntegerOnly]'
})
export class IntegerOnlyDirective {

  constructor() { }

  @HostListener('keypress') onkeypress(e) {
    const event = e || window.event;
    if (event) {
      return this.isIntegerKey(event);
    }
  }

  isIntegerKey(event) {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

}
