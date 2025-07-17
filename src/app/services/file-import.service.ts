import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FileImportService {

  constructor() { }

  async importCsvData(files: File[], type) {
    let fileContent = await this.getTextFromFile(files);
    let importedData = this.importDataFromCSV(fileContent, type);
    return importedData;
  }

  /**
   * Optimized CSV import with chunked processing for large files
   */
  async importCsvDataChunked(files: File[], type, chunkSize = 200, progressCallback?: (progress: number) => void, delayMs = 0) {
    const fileContent = await this.getTextFromFile(files);
    const propertyNames = fileContent.slice(0, fileContent.indexOf('\n')).split(',');
    const dataRows = fileContent.slice(fileContent.indexOf('\n') + 1).split('\n');

    if (type === 'kvlist') {
      const dataObj = {};
      const totalRows = dataRows.length;
      let processedRows = 0;

      for (let i = 0; i < dataRows.length; i += chunkSize) {
        const chunk = dataRows.slice(i, i + chunkSize);

        // Process chunk
        chunk.forEach((row) => {
          if (row.trim()) {
            const values = row.split(',');
            const obj = {};
            for (let index = 1; index < propertyNames.length; index++) {
              const propertyName = propertyNames[index];
              const val = values[index] || '';
              obj[propertyName] = val;
            }
            dataObj[values[0]] = obj;
          }
        });

        processedRows += chunk.length;

        // Report progress
        if (progressCallback) {
          progressCallback(Math.round((processedRows / totalRows) * 100));
        }

        // Yield control with minimal delays only when needed
        if (i + chunkSize < dataRows.length && delayMs > 0) {
          await this.delay(delayMs);
        }
      }

      return dataObj;
    } else {
      const dataArray = [];
      const totalRows = dataRows.length;
      let processedRows = 0;

      for (let i = 0; i < dataRows.length; i += chunkSize) {
        const chunk = dataRows.slice(i, i + chunkSize);

        // Process chunk
        chunk.forEach((row) => {
          if (row.trim()) {
            const values = row.split(',');
            const obj = {};
            for (let index = 0; index < propertyNames.length; index++) {
              const propertyName = propertyNames[index];
              const val = values[index] || '';
              obj[propertyName] = val;
            }
            dataArray.push(obj);
          }
        });

        processedRows += chunk.length;

        // Report progress
        if (progressCallback) {
          progressCallback(Math.round((processedRows / totalRows) * 100));
        }

        // Yield control with minimal delays only when needed
        if (i + chunkSize < dataRows.length && delayMs > 0) {
          await this.delay(delayMs);
        }
      }

      return dataArray;
    }
  }

  /**
   * Optimized JSON import with validation and memory management
   */
  async importJsonDataOptimized(files: File[], type, progressCallback?: (progress: number) => void, delayMs = 0) {
    const jsonText = await this.getTextFromFile(files);

    try {
      const jsonObj = JSON.parse(jsonText);

      if (type === 'kvlist') {
        const entries = Object.entries(jsonObj);
        const totalEntries = entries.length;

        // MUCH MORE AGGRESSIVE chunking for better performance
        let chunkSize = 50; // Reduced default chunk size for better responsiveness

        if (totalEntries > 2000) {
          chunkSize = 20;  // Small chunks for large datasets (was 50 for 15000+)
        } else if (totalEntries > 500) {
          chunkSize = 30; // Medium chunks for medium datasets (was 100 for 8000+)
        }

        const result = {};

        for (let i = 0; i < entries.length; i += chunkSize) {
          const chunk = entries.slice(i, i + chunkSize);

          chunk.forEach(([key, value]) => {
            result[key] = value;
          });

          // Report progress
          if (progressCallback) {
            progressCallback(Math.round(((i + chunkSize) / totalEntries) * 100));
          }

          // Yield control with minimal delays only when needed
          if (i + chunkSize < entries.length && delayMs > 0) {
            await this.delay(delayMs);
          }
        }

        return result;
      } else {
        if (progressCallback) {
          progressCallback(100);
        }
        return jsonObj;
      }
    } catch (error) {
      console.error('Error parsing JSON:', error);
      throw new Error('Invalid JSON format');
    }
  }

  /**
   * Utility method for chunked processing delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => {
      if (ms > 5 && 'requestIdleCallback' in window) {
        // Use requestIdleCallback for delays > 5ms for better performance
        requestIdleCallback(() => {
          if (ms > 5) {
            setTimeout(resolve, ms - 5); // Reduce overhead
          } else {
            resolve();
          }
        }, { timeout: ms + 20 }); // Reduced timeout
      } else {
        setTimeout(resolve, ms);
      }
    });
  }

  /**
   * Stream-based file reading for very large files
   */
  async getTextFromFileStream(files: File[], chunkSize = 1024 * 1024): Promise<string> {
    const file: File = files[0];
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      let result = '';
      let offset = 0;

      const readNextChunk = () => {
        if (offset >= file.size) {
          // Remove trailing newline if present
          if (result.endsWith('\n')) {
            result = result.slice(0, -1);
          }
          resolve(result);
          return;
        }

        const chunk = file.slice(offset, offset + chunkSize);
        reader.readAsText(chunk);
      };

      reader.onload = (e) => {
        result += e.target?.result as string;
        offset += chunkSize;

        // Use setTimeout to prevent blocking
        setTimeout(readNextChunk, 0);
      };

      reader.onerror = () => reject(reader.error);

      readNextChunk();
    });
  }

  /**
   * Optimized CSV validation for large files
   */
  async isCsvFileValidOptimized(files: File[], properties, type, keyName = 'Key', sampleSize = 1000) {
    const csvText = await this.getTextFromFile(files);
    const propertyNames = csvText.slice(0, csvText.indexOf('\n')).split(',');
    const propertiesLength = Object.keys(properties).length;

    if (type === 'kvlist') {
      if (propertyNames.length !== propertiesLength + 1) {
        return false;
      }

      // Check header
      for (const key of Object.keys(properties)) {
        if (propertyNames.indexOf(key) === -1) {
          return false;
        }
      }

      if (propertyNames.indexOf(keyName) === -1) {
        return false;
      }

      // Validate sample rows instead of all rows for large files
      const dataRows = csvText.slice(csvText.indexOf('\n') + 1).split('\n');
      const sampleRows = dataRows.length > sampleSize ?
        dataRows.slice(0, sampleSize) : dataRows;

      for (const row of sampleRows) {
        if (row.trim()) {
          const values = row.split(',');
          if (values.length !== propertiesLength + 1) {
            return false;
          }
        }
      }

      return true;
    } else {
      if (propertiesLength !== propertyNames.length) {
        return false;
      }

      for (const key of Object.keys(properties)) {
        if (propertyNames.indexOf(key) === -1) {
          return false;
        }
      }

      // Validate sample rows
      const dataRows = csvText.slice(csvText.indexOf('\n') + 1).split('\n');
      const sampleRows = dataRows.length > sampleSize ?
        dataRows.slice(0, sampleSize) : dataRows;

      for (const row of sampleRows) {
        if (row.trim()) {
          const values = row.split(',');
          if (values.length !== propertiesLength) {
            return false;
          }
        }
      }

      return true;
    }
  }

  async getTextFromFile(files: File[]) {
    const file: File = files[0];
    let fileContent = await file.text();
    let lastCharacter = fileContent.slice(-1);
    if (lastCharacter == '\n') {
      fileContent = fileContent.slice(0, -1);
    }
    return fileContent;
  }

  importDataFromCSV(csvText: string, type) {
    const propertyNames = csvText.slice(0, csvText.indexOf('\n')).split(',');
    const dataRows = csvText.slice(csvText.indexOf('\n') + 1).split('\n');
    if (type == 'kvlist') {
      let dataObj = {};
      dataRows.forEach((row) => {
        let values = row.split(',');
        let obj = new Object();
        for (let index = 0; index < propertyNames.length; index++) {
          if (index != 0) {
            const propertyName = propertyNames[index];
            let val = values[index];
            obj[propertyName] = val;
          }
        }
        dataObj[values[0]] = obj;
      });
      return dataObj;
    }
    else {
      let dataArray = [];
      dataRows.forEach((row) => {
        let values = row.split(',');
        let obj = new Object();
        for (let index = 0; index < propertyNames.length; index++) {
          const propertyName = propertyNames[index];
          let val = values[index];
          obj[propertyName] = val;
        }
        dataArray.push(obj);
      });
      return dataArray;
    }
  }

  async getTableData(files: File[]) {
    let csvText = await this.getTextFromFile(files);
    const dataRows = csvText.split('\n');
    return dataRows;
  }

  async isCsvFileValid(files: File[], properties, type, keyName = 'Key') {
    let csvText = await this.getTextFromFile(files);
    const propertyNames = csvText.slice(0, csvText.indexOf('\n')).split(',');
    let propertiesLength = Object.keys(properties).length;
    if (type == 'kvlist') {
      if (propertyNames.length != propertiesLength + 1) {
        return false;
      }
      for (let key of Object.keys(properties)) {
        if (propertyNames.indexOf(key) == -1) {
          return false;
        }
      }
      if (propertyNames.indexOf(keyName) == -1) {
        return false;
      }
      const dataRows = csvText.slice(csvText.indexOf('\n') + 1).split('\n');
      for (let row of dataRows) {
        if (row) {
          let values = row.split(',');
          if (values.length !== propertiesLength + 1) {
            return false;
          }
        }
      }
      return true;
    }
    else {
      if (propertiesLength != propertyNames.length) {
        return false;
      }
      for (let key of Object.keys(properties)) {
        if (propertyNames.indexOf(key) == -1) {
          return false;
        }
      }
      const dataRows = csvText.slice(csvText.indexOf('\n') + 1).split('\n');
      for (let row of dataRows) {
        if (row) {
          let values = row.split(',');
          if (values.length !== propertiesLength) {
            return false;
          }
        }
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

  async importJsonData(files: File[], type) {
    let jsonText = await this.getTextFromFile(files);
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

  getJsonTableData(json, type, keyName = 'Key') {
    if (type == 'list') {
      const header = Object.keys(json[0]);
      const rows = json.map((obj) => {
        return header.map((key) => {
          const value = obj[key];
          return `${value}`;
        }).join(',');
      });
      return [header.join(','), ...rows];
    }
    else {
      let rows = [];
      let header;
      for (let [key, val] of Object.entries(json)) {
        header = Object.keys(val);
        let row = header.map((key) => {
          const value = val[key];
          return `${value}`;
        }).join(',');
        row = key + ',' + row;
        rows.push(row)
      }
      header = keyName + ',' + header.join(',');
      return [header, ...rows];
    }
  }
}
