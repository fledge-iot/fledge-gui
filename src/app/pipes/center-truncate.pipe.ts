import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'centerTruncate'
})
export class CenterTruncatePipe implements PipeTransform {
    transform(value: string, maxLength: number): string {
        if (!value) return '';
        const halfLength = Math.floor((maxLength - 3) / 2); // Subtract 3 for "..."
        const start = value.slice(0, halfLength);
        const end = value.slice(-halfLength);
        return value.length > maxLength ? `${start}...${end}` : value;
    }
}
