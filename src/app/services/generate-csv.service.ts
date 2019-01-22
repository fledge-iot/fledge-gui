import { Injectable } from '@angular/core';
import { AlertService } from './alert.service';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class GenerateCsvService {
  private REQUEST_TIMEOUT_INTERVAL = 1000;

  constructor(private alertService: AlertService) { }

  download(data: any, filename: string, startTime: number) {
    const csvData = this.ConvertToCSV(data);
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

    const endTime = moment().format('HH:mm:ss');
    const seconds = moment.utc(moment(endTime, 'HH:mm:ss').diff(moment(startTime, 'HH:mm:ss'))).format('ss');
    console.log('Readings download completed at ', endTime);
    console.log('Time taken to complete the download: ', seconds + ' seconds') ;
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
}
