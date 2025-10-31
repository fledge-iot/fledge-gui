import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FileImportService {

  constructor() { }

  async importCsvData(files: File[], type, delimiter: string) {
    let fileContent = await this.getTextFromFile(files);
    let importedData = this.importDataFromCSV(fileContent, type, delimiter);
    return importedData;
  }

  importDataFromCSV(csvText: string, type: 'kvlist' | 'array', delimiter: string) {
    // Normalize line endings
    csvText = this.normalizeLineEndings(csvText);

    // Split into rows
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return type === 'kvlist' ? {} : [];

    // Header
    const propertyNames = lines[0].split(delimiter);

    // Data rows
    const dataRows = lines.slice(1);

    if (type === 'kvlist') {
      const dataObj: Record<string, any> = {};

      dataRows.forEach(row => {
        const values = row.split(delimiter);
        if (values.length !== propertyNames.length) return; // skip invalid row

        const obj: Record<string, any> = {};
        for (let i = 1; i < propertyNames.length; i++) {
          obj[propertyNames[i]] = values[i] ?? "";
        }
        dataObj[values[0]] = obj; // first column is the key
      });

      return dataObj;
    } else {
      const dataArray: any[] = [];

      dataRows.forEach(row => {
        const values = row.split(delimiter);
        if (values.length !== propertyNames.length) return; // skip invalid row

        const obj: Record<string, any> = {};
        propertyNames.forEach((prop, i) => {
          obj[prop] = values[i] ?? "";
        });
        dataArray.push(obj);
      });

      return dataArray;
    }
  }

  private normalizeLineEndings(text: string): string {
    return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }

  async getTableData(files: File[]) {
    let csvText = await this.getTextFromFile(files);
    // Normalize line endings to handle both LF and CRLF
    csvText = this.normalizeLineEndings(csvText);

    // Detect delimiter and convert to comma for preview compatibility
    const hasTab = csvText.includes('\t');
    if (hasTab) {
      csvText = csvText.replace(/\t/g, ',');
    }

    const dataRows = csvText.split('\n').filter(row => row.trim() !== ''); // optional: remove empty lines
    return dataRows;
  }

  async isCsvFileValid(files: File[], properties, type, keyName = 'Key') {
    let csvText = await this.getTextFromFile(files);

    // 🔑 Normalize all line endings to LF
    csvText = this.normalizeLineEndings(csvText);

    // Split into lines
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return false;

    // Detect delimiter
    const delimiter = lines[0].includes('\t') ? '\t' : ',';

    // Header row
    const propertyNames = lines[0].split(delimiter);
    const propertiesLength = Object.keys(properties).length;

    if (type === 'kvlist') {
      // Must contain all properties + keyName
      if (propertyNames.length !== propertiesLength + 1) return false;

      for (let key of Object.keys(properties)) {
        if (!propertyNames.includes(key)) return false;
      }
      if (!propertyNames.includes(keyName)) return false;

      // Validate rows
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(delimiter);
        if (values.length !== propertiesLength + 1) return false;
      }
      return true;

    } else {
      // Regular type
      if (propertyNames.length !== propertiesLength) return false;

      for (let key of Object.keys(properties)) {
        if (!propertyNames.includes(key)) return false;
      }

      // Validate rows
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(delimiter);
        if (values.length !== propertiesLength) return false;
      }
      return true;
    }
  }

  async isJsonFileValid(files: File[], properties, type, keyName = 'Key') {
    let jsonText = await this.getTextFromFile(files);
    let jsonObj = JSON.parse(jsonText);
    let propertiesLength = Object.keys(properties).length;
    if (type == 'kvlist') {
      if (Array.isArray(jsonObj)) {
        return false;
      }
      if (Object.keys(jsonObj).length == 0) {
        return false;
      }
      for (let [k, v] of Object.entries(jsonObj)) {
        if (Object.keys(v).length != propertiesLength) {
          return false;
        }
        for (let key of Object.keys(properties)) {
          if (!v.hasOwnProperty(key)) {
            return false;
          }
        }
      }
      return true;
    }
    else {
      if (!Array.isArray(jsonObj) || jsonObj.length == 0) {
        return false;
      }
      for (let item of jsonObj) {
        if (Object.keys(item).length != propertiesLength) {
          return false;
        }
        for (let key of Object.keys(properties)) {
          if (!item.hasOwnProperty(key)) {
            return false;
          }
        }
      }
      return true;
    }
  }

  async getTextFromFile(files: File[], removeTrailingNewline = true) {
    const file: File = files[0];
    let fileContent = await file.text();

    // Normalize all line endings to \n
    fileContent = this.normalizeLineEndings(fileContent);

    // Only remove trailing newline if requested (useful for CSV)
    if (removeTrailingNewline && fileContent.endsWith('\n')) {
      fileContent = fileContent.slice(0, -1);
    }

    return fileContent;
  }

  async importJsonData(files: File[], type) {
    let jsonText = await this.getTextFromFile(files, false); // keep trailing \n
    return JSON.parse(jsonText);
  }


  getFileName(files: File[]) {
    const file: File = files[0];
    return file.name;
  }

  getFileExtension(files: File[]) {
    const file: File = files[0];
    return file.name.substring(file.name.lastIndexOf('.') + 1);
  }

  isExtensionValid(ext) {
    if (ext == 'csv' || ext == 'json') {
      return true;
    }
    return false;
  }

  escapeCsvValue(value: any): string {
    if (value == null) return '';
    const str = `${value}`;
    if (/[,"\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`; // escape quotes
    }
    return str;
  }

  getJsonTableData(json: any, type: 'list' | 'kvlist', keyName = 'Key'): string[] {
    if (type === 'list') {
      const header = Object.keys(json[0]);
      const rows = json.map(obj => {
        return header.map(key => this.escapeCsvValue(obj[key])).join(',');
      });
      return [header.join(','), ...rows];
    } else {
      const rows: string[] = [];
      const headerKeys: string[] = [];
      for (let [key, val] of Object.entries(json)) {
        const valKeys = Object.keys(val);
        if (headerKeys.length === 0) headerKeys.push(...valKeys); // capture header only once
        const row = valKeys.map(k => this.escapeCsvValue(val[k])).join(',');
        rows.push(`${key},${row}`);
      }
      const header = `${keyName},${headerKeys.join(',')}`; // separate string variable
      return [header, ...rows];
    }
  }
}
