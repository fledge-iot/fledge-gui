import { Directive, HostListener, ElementRef } from '@angular/core';

@Directive({
  selector: '[appFloatOnly]'
})
export class FloatOnlyDirective {

  constructor(private el: ElementRef) { }

  @HostListener('keypress', ['$event']) onKeyPress(event: KeyboardEvent) {
    const allowedChars = /[0-9.]/;
    const inputChar = String.fromCharCode(event.charCode);
    const isScientificNotation = event.key === 'e' || event.key === 'E';
    const isNegativeSign = event.key === '-';
    const inputValue = this.el.nativeElement.value;
    const cursorPosition = this.el.nativeElement.selectionStart;

    // Check if the pressed key is '-' and if the cursor is at the start
    // Or any character is being entered before '-'
    if (isNegativeSign && cursorPosition !== 0 || inputValue[cursorPosition] === '-') {
      // Prevent the default action if the cursor is not at the start
      event.preventDefault();
    }

    if (!allowedChars.test(inputChar) && !isScientificNotation && !isNegativeSign) {
      event.preventDefault();
    }

    // Handle scientific notation input (like '1e10')
    if (isScientificNotation && ((event.target as HTMLInputElement).value.includes('e') || (event.target as HTMLInputElement).value.includes('E'))) {
      // Prevent multiple 'e's
      event.preventDefault();
    }

    // Allow only one decimal point
    if (inputChar === '.' && (event.target as HTMLInputElement).value.includes('.')) {
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event']) onPaste(event: ClipboardEvent) {
    const pastedData = event.clipboardData?.getData('text');

    // Allow only valid integers (including negative numbers)
    if (pastedData && !/^-?\d*\.?\d*(e-?\d+)?$/.test(pastedData.trim())) {
      event.preventDefault(); // Prevent pasting invalid data
    }
  }
}
