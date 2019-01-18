import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GenerateCsvService {
  constructor() { }

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
    const endTime = +new Date();

    console.log('download end time', this.millisToMinutesAndSeconds(endTime - startTime));
  }

  millisToMinutesAndSeconds(millis) {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + ':' + (+seconds < 10 ? '0' : '') + seconds;
  }

  // convert Json to CSV data
  ConvertToCSV(assetData: any) {
    let str = '';
    let row = '';
    for (const header in assetData[0]) {
      row += header + ';';
    }
    row = row.slice(0, -1);
    // append Label row with line break
    str += row + '\r\n';
    for (let i = 0; i < assetData.length; i++) {
      let line = '';
      for (const key in assetData[i]) {
        if (line !== '') {
          line += ';';
        }
        line += JSON.stringify(assetData[i][key]);
      }
      str += line + '\r\n';
    }
    return str;
  }
}
