import { Injectable } from '@angular/core';
import { DelimiterStoreService } from './delimiter-store.service';

type ViewMode = 'list' | 'kvlist';

export interface ParseResult<T> {
  error?: string;
  delimiter?: string | null;
  items?: T;
}

@Injectable({ providedIn: 'root' })
export class CsvJsonConverterService {
  private readonly candidateDelimiters = [',', ';', '\t', '|', ':'];

  constructor(private delimiterStore: DelimiterStoreService) { }

  // ===== Build helpers =====
  getJsonFromForm(mode: ViewMode, configuration: any, rows: any[]): string {
    if (mode === 'kvlist') {
      const obj: Record<string, any> = {};
      (rows || []).forEach((r: any) => { obj[r.key] = r.value; });
      return JSON.stringify(obj, null, 2);
    }
    return JSON.stringify(rows || [], null, 2);
  }

  getCsvFromForm(mode: ViewMode, configuration: any, rows: any[], current?: string | null): string {
    const delimiter = this.delimiterStore.getDelimiter() ?? current ?? ',';
    if (mode === 'kvlist') {
      const keyName = configuration.keyName || 'key';
      if (configuration.items === 'object') {
        const headers = Object.keys(configuration.properties);
        const lines = (rows || []).map((r: any) => {
          const vals = headers.map(h => `${r.value?.[h] ?? ''}`).join(delimiter);
          return `${r.key}${delimiter}${vals}`;
        });
        return [keyName + delimiter + headers.join(delimiter), ...lines].join('\n');
        return [configuration.keyName + delimiter + headers.join(delimiter), ...lines].join('\n');
      }
      const lines = (rows || []).map((r: any) => `${r.key}${delimiter}${r.value ?? ''}`);
      return [keyName + delimiter + 'value', ...lines].join('\n');
    }
    if (configuration.items === 'object') {
      const headers = Object.keys(configuration.properties);
      const lines = (rows || []).map((v: any) => headers.map(h => `${v?.[h] ?? ''}`).join(delimiter));
      return [headers.join(delimiter), ...lines].join('\n');
    }
    const header = 'value';
    const lines = (rows as any[] || []).map(v => `${v ?? ''}`);
    return [header, ...lines].join('\n');
  }

  // ===== Delimiter detection =====
  detectDelimiter(headerLine: string): string | null {
    const found = this.candidateDelimiters.filter(d => headerLine.includes(d));
    if (found.length === 1) {
      this.delimiterStore.setDelimiter(found[0]);
      return found[0];
    }
    this.delimiterStore.setDelimiter(null);
    return null;
  }

  // ===== JSON parse/validate =====
  parseJsonForKvList(text: string, configuration: any): ParseResult<Array<{ key: string, value: any }>> {
    try {
      const parsed = JSON.parse(text || '{}');

      if (!parsed || Object.keys(parsed).length === 0) {
        return {
          items: []
        };
      }
      if (!(parsed && typeof parsed === 'object' && !Array.isArray(parsed))) {
        return { error: 'Invalid JSON format. Root must be an object.' };
      }
      const keyName = configuration.keyName || 'Key';
      const required = Object.keys(configuration.properties);
      const items: Array<{ key: string, value: any }> = [];

      for (const [key, value] of Object.entries(parsed)) {
        const rowLine = `${keyName} "${key}"`;

        if (!(key as string)?.trim()) return { error: `Missing required "${keyName}".` };

        if (!(value && typeof value === 'object' && !Array.isArray(value))) {
          return { error: `${rowLine} has invalid value. Expected an object with properties (${required.join(', ')}).` };
        }

        const missing = required.filter(p => !(p in (value as any)));
        if (missing.length) return { error: `${rowLine} is missing required properties: ${missing.join(', ')}.` };

        const extra = Object.keys(value as any).filter(p => !required.includes(p));
        if (extra.length) return { error: `${rowLine} has extra invalid properties: ${extra.join(', ')}.` };

        items.push({ key: key as string, value });
      }
      return { items };
    } catch (e: any) {
      return { error: 'Invalid JSON: ' + e.message };
    }
  }

  parseJsonForList(text: string, configuration: any): ParseResult<any[]> {
    try {
      const parsed = JSON.parse(text || '[]');
      if (configuration.items === 'object') {
        if (!Array.isArray(parsed)) return { error: 'Invalid JSON format. Expected an array of objects.' };
        const expected = Object.keys(configuration.properties);
        if (parsed.length === 0) return { error: 'Invalid data: JSON contains no items.' };

        for (let i = 0; i < parsed.length; i++) {
          const obj = parsed[i];
          if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
            return { error: `Invalid item at index ${i}. Expected object with keys (${expected.join(', ')}).` };
          }
          const keys = Object.keys(obj);
          if (keys.length !== expected.length) {
            return { error: `Key count mismatch at item ${i}: found ${keys.length} keys, expected ${expected.length} (${expected.join(', ')})` };
          }
          if (!expected.every(h => keys.includes(h))) {
            return { error: `Key mismatch at item ${i}: found keys (${keys.join(', ')}) but expected (${expected.join(', ')})` };
          }
        }
        return { items: parsed };
      }

      if (!Array.isArray(parsed)) return { error: 'Invalid JSON format. Expected an array.' };
      if (parsed.length === 0) return { error: 'Invalid data: JSON contains no items.' };
      return { items: parsed };
    } catch {
      return { error: 'Invalid JSON format.' };
    }
  }

  // ===== CSV parse/validate =====
  parseCsvForKv(text: string, configuration: any): ParseResult<Array<{ key: string, value: any }>> {
    const raw = (text ?? '').trim();
    if (!raw) return {
      error: null
    };

    const lines = raw.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return { error: 'Empty file or invalid CSV format.' };

    const headerLine = lines.shift() || '';
    const delimiter = this.detectDelimiter(headerLine);
    if (!delimiter) return { error: 'Invalid CSV format. Use comma, semicolon, tab, pipe or colon as delimiter.' };
    const headers = headerLine.split(delimiter);
    const keyName = configuration.keyName || 'Key';
    if (configuration.items === 'object') {
      const expected = [keyName, ...Object.keys(configuration.properties)];
      if (headers.length !== expected.length) {
        return { error: `Header count mismatch: CSV has ${headers.length} columns but expected ${expected.length} (${expected.join(', ')})` };
      }
      if (!expected.every(h => headers.includes(h))) {
        return { error: `Header mismatch: CSV has columns (${headers.join(', ')}) but expected (${expected.join(', ')})` };
      }
      if (lines.length === 0) return { error: 'Missing required "Key" value at line 2.' };

      const items: Array<{ key: string, value: any }> = [];

      for (let i = 0; i < lines.length; i++) {
        let cols = lines[i].split(delimiter);
        while (cols.length < headers.length) cols.push('');
        if (cols.length > headers.length) {
          return { error: `Invalid data format at line ${i + 1}. Found ${cols.length} columns, expected ${headers.length}.` };
        }
        const key = (cols[0] || '').trim();
        if (!key) return { error: `Missing required "Key" value at line ${i + 2}.` };

        const value: any = {};
        Object.keys(configuration.properties).forEach((h, idx) => {
          value[h] = cols[idx + 1] ?? '';
        });
        items.push({ key, value });
      }

      return { items, delimiter };
    }

    const expected = [keyName, 'value'];
    if (headers.length !== expected.length || !expected.every(h => headers.includes(h))) {
      return { error: `Header mismatch: CSV has columns (${headers.join(', ')}) but expected (${expected.join(', ')})` };
    }
    const items: Array<{ key: string, value: any }> = [];
    for (let i = 0; i < lines.length; i++) {
      const cols = lines[i].split(delimiter);
      if (cols.length > expected.length) {
        return { error: `Invalid data format at line ${i + 1}. Found ${cols.length} columns, expected ${expected.length}.` };
      }
      const key = (cols[0] || '').trim();
      if (!key) return { error: `Missing required "Key" value at line ${i + 2}.` };
      items.push({ key, value: cols[1] ?? '' });
    }
    return { items, delimiter };
  }

  parseCsvForList(text: string, configuration: any): ParseResult<any[]> {
    const raw = (text ?? '').trim();
    if (!raw) return {
      error: null
    };

    const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return { error: 'Empty file or invalid CSV format.' };

    const headerLine = lines.shift() || '';
    const delimiter = this.detectDelimiter(headerLine);
    if (!delimiter) return { error: 'Invalid CSV format. Use comma, semicolon, tab, pipe or colon as delimiter.' };

    const headers = headerLine.split(delimiter);

    if (configuration.items === 'object') {
      const expected = Object.keys(configuration.properties);
      if (headers.length !== expected.length) {
        return { error: `Header count mismatch: CSV has ${headers.length} columns but expected ${expected.length} columns (${expected.join(', ')})` };
      }
      if (!expected.every(h => headers.includes(h))) {
        return { error: `Header mismatch: CSV has columns (${headers.join(', ')}) but expected columns (${expected.join(', ')})` };
      }
      if (lines.length === 0) {
        return { error: 'Invalid data: CSV contains only header row and no data rows.' };
      }

      for (let i = 0; i < lines.length; i++) {
        let cols = lines[i].split(delimiter);
        while (cols.length < headers.length) cols.push('');
        if (cols.length > headers.length) {
          return { error: `Invalid data format at line ${i + 1}. Found ${cols.length} columns, expected ${headers.length}.` };
        }
        lines[i] = cols.join(delimiter);
      }

      const items = lines.map(line => {
        const cols = line.split(delimiter);
        return headers.reduce((obj: any, h, idx) => {
          obj[h] = cols[idx] ?? '';
          return obj;
        }, {});
      });

      return { items, delimiter };
    }

    const expected = ['value'];
    if (headers.length !== 1 || headers[0] !== 'value') {
      return { error: `Header mismatch: CSV has columns (${headers.join(', ')}) but expected columns (${expected.join(', ')})` };
    }
    const items = lines.map(line => line.split(delimiter)[0] ?? '');
    return { items, delimiter };
  }
}


