import { ElementRef } from '@angular/core';
import { RefDirective } from './ref.directive';

describe('RefDirective', () => {
  it('should create an instance', () => {
    const directive = new RefDirective(new ElementRef(document.createElement('div')));
    expect(directive).toBeTruthy();
  });
});
