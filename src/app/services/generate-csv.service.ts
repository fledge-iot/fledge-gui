import { Injectable } from '@angular/core';
import { AlertService } from './alert.service';
import { uniq } from 'lodash';

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
    const keys = ['timestamp'];
    for (const asset of assetData) {
      for (const key in asset.reading) {
        keys.push(key);
      }
    }
    const uniqueKeys = uniq(keys);
    const csvContent =
      uniqueKeys.join(',') +
      '\n' +
      assetData.map(asset => {
        return uniqueKeys.map(k => {
          const cell = k === 'timestamp' ? asset.timestamp :
            (asset.reading[k] === null || asset.reading[k] === undefined ? '' :
              (asset.reading[k] instanceof Array ? '"' + asset.reading[k].join() + '"' : asset.reading[k]));
          return cell;
        }).join(',');
      }).join('\n');
    return csvContent;
  }
}
