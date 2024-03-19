import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[appFloatOnly]'
})
export class FloatOnlyDirective {

  constructor() { }

  @HostListener('keypress', ['$event']) onKeyPress(event: KeyboardEvent) {
    const allowedChars = /[0-9.]/;
    const inputChar = String.fromCharCode(event.charCode);

    if (!allowedChars.test(inputChar)) {
      event.preventDefault();
    }

    // Allow only one decimal point
    if (inputChar === '.' && (event.target as HTMLInputElement).value.includes('.')) {
      event.preventDefault();
    }
  }
}
