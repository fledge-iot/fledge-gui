import { Injectable } from '@angular/core';
import { AlertService } from './alert.service';

@Injectable({
  providedIn: 'root'
})
export class GenerateCsvService {
  private REQUEST_TIMEOUT_INTERVAL = 1000;

  constructor(private alertService: AlertService) { }

  download(data: any, filename: string, type: string) {
    let csvData = '';
    if (type === 'service') {
      csvData = this.ConvertToCSV(data);
    } else if (type === 'asset') {
      csvData = this.ConvertAssetReadsToCSV(data);
    }
    const a: any = document.createElement('a');
    a.setAttribute('style', 'display:none;');
    document.body.appendChild(a);
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = filename + '.csv';
    a.click();
    setTimeout(() => {
      this.alertService.closeMessage();
    }, this.REQUEST_TIMEOUT_INTERVAL);
  }

  // convert Json to CSV data
  ConvertToCSV(assetData: any) {
    let str = '';
    let row = '';
    for (const header in assetData[0]) {
      row += header + ',';
    }
    row = row.slice(0, -1);
    // append Label row with line break
    str += row + '\r\n';
    for (let i = 0; i < assetData.length; i++) {
      let line = '';
      for (const key in assetData[i]) {
        if (line !== '') {
          line += ',';
        }
        if (typeof assetData[i][key] === 'object') {
          line += JSON.stringify(assetData[i][key]).split(',').join('; ');
        } else {
          line += JSON.stringify(assetData[i][key]);
        }
      }
      str += line + '\r\n';
    }
    return str;
  }

  ConvertAssetReadsToCSV(assetData: any) {
    let str = '';
    let row = 'timestamp';
    const keys = Object.keys(assetData[0].reading);
    for (const header of keys) {
      row += ',' + header;
    }
    // append Label row with line break
    str += row + '\r\n';
    for (const asset of assetData) {
      let line = asset.timestamp;
      for (const key in asset.reading) {
        if (asset.reading.hasOwnProperty(key) && key !== 'spectrum') {
          line += ',' + asset.reading[key];
        } else {
          line += ',' + '"' + asset.reading[key].join() + '"';
        }
      }
      str += line + '\r\n';
    }
    return str;
  }
}
