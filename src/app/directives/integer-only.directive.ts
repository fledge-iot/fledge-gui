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

    // Check if the pressed key is '-' and if the cursor is at the start Or any character is being entered before '-'
    if (event.key === '-' && cursorPosition !== 0 || inputValue[cursorPosition] === '-') {
      // Prevent the default action if the cursor is not at the start
      event.preventDefault();
    }
    if (event) {
      return this.isIntegerKey(event);
    }
  }

  isIntegerKey(event) {
    const isNumber = (event.key >= '0' && event.key <= '9');
    const isControl = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'].includes(event.key);
    const isNegativeSign = event.key === '-';
    const isScientificNotation = event.key === 'e' || event.key === 'E';

    if (!isNumber && !isControl && !isNegativeSign && !isScientificNotation) {
      return false;
    }

    // Handle scientific notation input (like '1e10')
    if (isScientificNotation && (this.el.nativeElement.value.includes('e') || this.el.nativeElement.value.includes('E'))) {
      event.preventDefault(); // Prevent multiple 'e's
    }
    return true;
  }

  @HostListener('paste', ['$event']) onPaste(event: ClipboardEvent) {
    const pastedData = event.clipboardData?.getData('text');

    // Allow only valid integers (including negative numbers)
    if (pastedData && !/^-?\d+$/.test(pastedData.trim())) {
      event.preventDefault(); // Prevent pasting invalid data
    }
  }
}
