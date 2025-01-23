import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CsvService {

  constructor() { }

  async importData(files: File[]) {
    let fileContent = await this.getTextFromFile(files);
    let importedData = this.importDataFromCSV(fileContent);
    return importedData;
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

  importDataFromCSV(csvText: string): Array<any> {
    const propertyNames = csvText.slice(0, csvText.indexOf('\n')).split(',');
    const dataRows = csvText.slice(csvText.indexOf('\n') + 1).split('\n');
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

  isExtensionValid(files: File[]) {
    const file: File = files[0];
    const ext = file.name.substring(file.name.lastIndexOf('.') + 1);
    if (ext == 'csv') {
      return true;
    }
    return false;
  }

  getFileName(files: File[]) {
    const file: File = files[0];
    return file.name;
  }

  async getTableData(files: File[]) {
    let csvText = await this.getTextFromFile(files);
    const dataRows = csvText.split('\n');
    return dataRows;
  }

  async isFileValid(files: File[], properties) {
    let csvText = await this.getTextFromFile(files);
    const propertyNames = csvText.slice(0, csvText.indexOf('\n')).split(',');
    let propertiesLength = Object.keys(properties).length;
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
