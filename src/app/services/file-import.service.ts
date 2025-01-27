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
}
