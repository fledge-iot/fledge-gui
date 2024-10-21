import { Directive, HostListener, ElementRef } from '@angular/core';

@Directive({
  selector: '[appIntegerOnly]'
})
export class IntegerOnlyDirective {
  constructor(private el: ElementRef) { }

  @HostListener('keypress') onkeypress(e) {
    const inputValue = this.el.nativeElement.value;
    const cursorPosition = this.el.nativeElement.selectionStart;
    const event = e || window.event;

    this.checkPositiveSignPosition(event, inputValue, cursorPosition);
    this.checkNegativeSignPosition(event, inputValue, cursorPosition);

    // Check if any character is being entered before '-' or '+'
    if (['-', '+'].includes(inputValue[cursorPosition])) {
      event.preventDefault();
    }

    if (event) {
      return this.isIntegerKey(event);
    }
  }

  isIntegerKey(event) {
    const isNumber = (event.key >= '0' && event.key <= '9');
    const isAllowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'e', 'E', '-', '+'].includes(event.key);
    const isScientificNotation = event.key.toLowerCase() === 'e';
    const hasAlreadyScientificNotation = this.el.nativeElement.value.includes('e') || this.el.nativeElement.value.includes('E');
    if (isNumber || isAllowedKeys) {
      // Handle scientific notation input (like '1e10')
      if (isScientificNotation && hasAlreadyScientificNotation) {
        event.preventDefault(); // Prevent multiple 'e's
      }
      return true;
    }
    return false;
  }

  checkPositiveSignPosition(event, inputValue, cursorPosition) {
    // Check if pressed key is '+' and if the cursor is after 'e'/'E'
    if (event.key === '+' && !['e', 'E'].includes(inputValue[cursorPosition - 1])) {
      event.preventDefault();
    }
  }

  checkNegativeSignPosition(event, inputValue, cursorPosition) {
    // Check if pressed key is '-' and if the cursor is at the start or after 'e'/'E'
    if (event.key === '-' && cursorPosition !== 0 && !['e', 'E'].includes(inputValue[cursorPosition - 1])) {
      // Prevent the default action if the cursor is not at the start
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event']) onPaste(event: ClipboardEvent) {
    const pastedData = event.clipboardData?.getData('text');

    // Allow only valid integers (including negative numbers)
    if (pastedData && !/^-?(0|[1-9]\d*)([eE][-+]?\d+)?$/.test(pastedData.trim())) {
      event.preventDefault(); // Prevent pasting invalid data
    }
  }
}
