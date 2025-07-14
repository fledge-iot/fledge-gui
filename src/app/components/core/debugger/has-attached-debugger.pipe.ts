import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'hasAttachedDebugger',
  pure: true
})
export class HasAttachedDebuggerPipe implements PipeTransform {
  transform(items: any[], filterByExecutionService: boolean = false): boolean {
    if (!Array.isArray(items)) return false;

    const filtered = filterByExecutionService
      ? items.filter(item => item.execution === 'service')
      : items;

    return filtered.some(item => item.debug?.debugger === 'Attached');
  }
}
