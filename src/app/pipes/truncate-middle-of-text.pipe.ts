import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'truncateMiddleOfText'
})
export class TruncateMiddleOfTextPipe implements PipeTransform {
    transform(value: string, maxLength: number = 16): string {
        if (!value || value.length <= maxLength) return value;
        const halfLength = Math.floor((maxLength - 3) / 2); // Subtract 3 for "..."
        return value.slice(0, halfLength) + '...' + value.slice(-halfLength);
    }
}
