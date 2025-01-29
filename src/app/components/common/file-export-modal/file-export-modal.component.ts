import { Component, Input } from '@angular/core';
import { AlertService } from '../../../services';

@Component({
  selector: 'app-file-export-modal',
  templateUrl: './file-export-modal.component.html',
  styleUrls: ['./file-export-modal.component.css']
})
export class FileExportModalComponent {
  @Input() data;
  format = 'csv';

  constructor(private alertService: AlertService) { }

  public toggleModal(isOpen: Boolean) {
    const modalName = <HTMLDivElement>document.getElementById('modal-box-1');
    if (isOpen) {
      modalName.classList.add('is-active');
      return;
    }
    modalName.classList.remove('is-active');
  }

  exportFile(fileName = 'abc') {
    if (this.format == 'json') {
      let jsonData = JSON.stringify(this.data);
      this.downloadFile(jsonData, fileName);
    }
    else {
      let csvData = this.jsonTocsv(this.data);
      this.downloadFile(csvData, fileName);
    }
  }

  formReset() {
    this.toggleModal(false);
  }

  public toggleDropDown(id: string) {
    const activeDropDowns = Array.prototype.slice.call(document.querySelectorAll('.dropdown.is-active'));
    if (activeDropDowns.length > 0) {
      if (activeDropDowns[0].id !== id) {
        activeDropDowns[0].classList.remove('is-active');
      }
    }
    const dropDown = document.querySelector(`#${id}`);
    dropDown.classList.toggle('is-active');
  }

  setformat(format) {
    this.format = format;
  }

  downloadFile(data: any, filename: string) {
    const a: any = document.createElement('a');
    a.setAttribute('style', 'display:none;');
    document.body.appendChild(a);
    const blob = new Blob([data], { type: 'text/json' });
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    if (this.format == 'json') {
      a.download = filename + '.json';
    }
    else {
      a.download = filename + '.csv';
    }
    a.click();
    setTimeout(() => {
      this.alertService.closeMessage();
    }, 1000);
  }

  jsonTocsv(json) {
    const header = Object.keys(json[0]);
    const rows = json.map((obj) => {
      return header.map((key) => {
        const value = obj[key];
        return `${value}`;
      }).join(',');
    });
    return [header.join(','), ...rows].join('\n');
  }
}
