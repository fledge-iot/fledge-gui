import { Component, HostListener, Input, ChangeDetectorRef, NgZone } from '@angular/core';
import { AlertService } from '../../../services';

@Component({
  selector: 'app-file-export-modal',
  templateUrl: './file-export-modal.component.html',
  styleUrls: ['./file-export-modal.component.css']
})
export class FileExportModalComponent {
  @Input() data;
  @Input() configuration;
  @Input() categoryName;
  format = 'csv';
  isExporting = false; // Loading state for export processing

  constructor(
    private alertService: AlertService,
    private cdRef: ChangeDetectorRef,
    private zone: NgZone
  ) { }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    if (!this.isExporting) {
      this.formReset();
    }
  }

  public toggleModal(isOpen: boolean) {
    const modalName = <HTMLDivElement>document.getElementById('file-export-modal-' + this.configuration.key);
    if (isOpen) {
      modalName.classList.add('is-active');
      return;
    }
    modalName.classList.remove('is-active');
  }

  exportFile() {
    // Check data size and decide if async processing is needed
    const dataSize = this.getDataSize();
    const needsAsyncProcessing = dataSize > 200; // Reduced from 1000 to 200 for more aggressive optimization

    if (needsAsyncProcessing) {
      this.isExporting = true;
      this.cdRef.detectChanges();

      // Process large datasets asynchronously to prevent blocking
      this.zone.runOutsideAngular(() => {
        setTimeout(() => {
          this.zone.run(() => {
            this.processExport();
            this.isExporting = false;
            this.cdRef.detectChanges();
          });
        }, 10); // Small delay to let UI update
      });
    } else {
      // Process small datasets immediately
      this.processExport();
    }
  }

  private getDataSize(): number {
    if (this.configuration.type == 'list') {
      return Array.isArray(this.data) ? this.data.length : 0;
    } else {
      return this.data ? Object.keys(this.data).length : 0;
    }
  }

  private processExport() {
    if (this.format == 'json') {
      let jsonData;
      if (this.configuration.type == 'list') {
        if (this.data.length > 0) {
          jsonData = JSON.stringify(this.data);
        }
        else {
          let json = {};
          for (let key of Object.keys(this.configuration.properties)) {
            json[key] = '';
          }
          jsonData = JSON.stringify([json]);
        }
      }
      else {
        if (Object.keys(this.data).length > 0) {
          jsonData = JSON.stringify(this.data);
        }
        else {
          let json = {};
          for (let key of Object.keys(this.configuration.properties)) {
            json[key] = '';
          }
          let jsonObj = {};
          let keyName = this.configuration.keyName ? this.configuration.keyName : 'Key';
          jsonObj[keyName] = json;
          jsonData = JSON.stringify(jsonObj);
        }
      }
      let fileName = this.categoryName + '-' + this.configuration?.key;
      this.downloadFile(jsonData, fileName);
    }
    else {
      let csvData = this.jsonTocsv(this.data);
      let fileName = this.categoryName + '-' + this.configuration?.key;
      this.downloadFile(csvData, fileName);
    }
  }

  formReset() {
    this.setformat('csv');
    this.hideDropDown('format-dropdown-' + this.configuration.key);
    this.toggleModal(false);
  }

  toggleDropDown(id: string) {
    const dropdown = document.getElementById(id);
    if (dropdown) {
      dropdown.classList.toggle('is-active');
    }
  }

  hideDropDown(id: string) {
    const dropdown = document.getElementById(id);
    if (dropdown && dropdown.classList.contains('is-active')) {
      dropdown.classList.toggle('is-active');
    }
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
    // Optimized CSV generation for large datasets
    if (this.configuration.type == 'list') {
      let header;
      if (json.length > 0) {
        header = Object.keys(json[0]);

        // Process in chunks for large datasets to prevent blocking
        if (json.length > 500) { // Reduced from 5000 to 500 for more aggressive optimization
          return this.processLargeArrayToCsv(json, header);
        } else {
          const rows = json.map((obj) => {
            return header.map((key) => {
              const value = obj[key];
              return `${value}`;
            }).join(',');
          });
          return [header.join(','), ...rows].join('\n');
        }
      }
      else {
        header = Object.keys(this.configuration.properties);
        return header.join(',');
      }
    }
    else {
      let rows = [];
      let header;
      if (Object.keys(json).length > 0) {
        const entries = Object.entries(json);

        // Process in chunks for large datasets to prevent blocking
        if (entries.length > 500) { // Reduced from 5000 to 500 for more aggressive optimization
          return this.processLargeObjectToCsv(entries);
        } else {
          for (let [key, val] of entries) {
            header = Object.keys(val);
            let row = header.map((key) => {
              const value = val[key];
              return `${value}`;
            }).join(',');
            row = key + ',' + row;
            rows.push(row)
          }
        }
      }
      else {
        header = Object.keys(this.configuration.properties);
      }
      header = (this.configuration.keyName ? this.configuration.keyName : 'Key') + ',' + header.join(',');
      return [header, ...rows].join('\n');
    }
  }

  private processLargeArrayToCsv(json: any[], header: string[]): string {
    // Process large arrays in chunks to prevent blocking
    let result = header.join(',') + '\n';
    const chunkSize = 1000;

    for (let i = 0; i < json.length; i += chunkSize) {
      const chunk = json.slice(i, i + chunkSize);
      const chunkRows = chunk.map((obj) => {
        return header.map((key) => {
          const value = obj[key];
          return `${value}`;
        }).join(',');
      });
      result += chunkRows.join('\n');
      if (i + chunkSize < json.length) {
        result += '\n';
      }
    }

    return result;
  }

  private processLargeObjectToCsv(entries: [string, any][]): string {
    // Process large objects in chunks to prevent blocking
    let header;
    let rows = [];
    const chunkSize = 1000;

    for (let i = 0; i < entries.length; i += chunkSize) {
      const chunk = entries.slice(i, i + chunkSize);
      for (let [key, val] of chunk) {
        if (!header) {
          header = Object.keys(val);
        }
        let row = header.map((key) => {
          const value = val[key];
          return `${value}`;
        }).join(',');
        row = key + ',' + row;
        rows.push(row);
      }
    }

    const headerRow = (this.configuration.keyName ? this.configuration.keyName : 'Key') + ',' + header.join(',');
    return [headerRow, ...rows].join('\n');
  }
}
