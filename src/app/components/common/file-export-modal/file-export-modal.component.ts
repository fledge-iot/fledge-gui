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
    // Start timing for export operation
    const exportStartTime = performance.now();
    const dataSize = this.getDataSize();
    const format = this.format;

    console.log(`🚀 EXPORT START: Format=${format.toUpperCase()}, Type=${this.configuration.type}, Items=${dataSize}, Category=${this.categoryName}`);

    // Check data size and decide if async processing is needed
    const needsAsyncProcessing = dataSize > 200; // Reduced from 1000 to 200 for more aggressive optimization

    if (needsAsyncProcessing) {
      this.isExporting = true;
      this.cdRef.detectChanges();

      // Process large datasets asynchronously to prevent blocking
      this.zone.runOutsideAngular(() => {
        setTimeout(() => {
          this.zone.run(() => {
            this.processExport(exportStartTime);
            this.isExporting = false;
            this.cdRef.detectChanges();
          });
        }, 10); // Small delay to let UI update
      });
    } else {
      // Process small datasets immediately
      this.processExport(exportStartTime);
    }
  }

  private getDataSize(): number {
    if (this.configuration.type == 'list') {
      return Array.isArray(this.data) ? this.data.length : 0;
    } else {
      return this.data ? Object.keys(this.data).length : 0;
    }
  }

  private processExport(startTime?: number) {
    const exportStartTime = startTime || performance.now();
    const dataSize = this.getDataSize();
    const format = this.format;

    if (!this.data) {
      console.log(`❌ EXPORT FAILED: No data available for ${this.categoryName}-${this.configuration?.key}`);
      return;
    }

    if (this.format == 'json') {
      const jsonStartTime = performance.now();
      console.log(`📄 JSON PROCESSING START: Converting ${dataSize} items to JSON`);

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

      const jsonEndTime = performance.now();
      console.log(`✅ JSON PROCESSING COMPLETE: ${jsonEndTime - jsonStartTime}ms for ${dataSize} items`);

      let fileName = this.categoryName + '-' + this.configuration?.key;
      this.downloadFile(jsonData, fileName, exportStartTime);
    }
    else {
      const csvStartTime = performance.now();
      console.log(`📊 CSV PROCESSING START: Converting ${dataSize} items to CSV`);

      let csvData = this.jsonTocsv(this.data);

      const csvEndTime = performance.now();
      console.log(`✅ CSV PROCESSING COMPLETE: ${csvEndTime - csvStartTime}ms for ${dataSize} items`);

      let fileName = this.categoryName + '-' + this.configuration?.key;
      this.downloadFile(csvData, fileName, exportStartTime);
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

  downloadFile(data: any, filename: string, exportStartTime?: number) {
    const downloadStartTime = performance.now();
    console.log(`💾 DOWNLOAD START: Creating blob and initiating download for ${filename}.${this.format}`);

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

    const downloadEndTime = performance.now();
    const totalExportTime = exportStartTime ? downloadEndTime - exportStartTime : downloadEndTime - downloadStartTime;

    console.log(`💾 DOWNLOAD COMPLETE: ${downloadEndTime - downloadStartTime}ms for file creation`);
    console.log(`🎉 TOTAL EXPORT TIME: ${totalExportTime}ms - Format=${this.format.toUpperCase()}, Type=${this.configuration.type}, Items=${this.getDataSize()}, File=${filename}.${this.format}`);

    setTimeout(() => {
      this.alertService.closeMessage();
    }, 1000);
  }

  jsonTocsv(json) {
    const csvStartTime = performance.now();
    const dataSize = this.getDataSize();
    console.log(`🔄 CSV CONVERSION START: Processing ${dataSize} items`);

    // Optimized CSV generation for large datasets
    if (this.configuration.type == 'list') {
      let header;
      if (json.length > 0) {
        header = Object.keys(json[0]);

        // Process in chunks for large datasets to prevent blocking
        if (json.length > 500) { // Reduced from 5000 to 500 for more aggressive optimization
          console.log(`⚡ Using chunked CSV processing for ${json.length} items`);
          const result = this.processLargeArrayToCsv(json, header);
          const csvEndTime = performance.now();
          console.log(`✅ CHUNKED CSV CONVERSION COMPLETE: ${csvEndTime - csvStartTime}ms for ${json.length} items`);
          return result;
        } else {
          console.log(`🏃 Using standard CSV processing for ${json.length} items`);
          const rows = json.map((obj) => {
            return header.map((key) => {
              const value = obj[key];
              return `${value}`;
            }).join(',');
          });
          const result = [header.join(','), ...rows].join('\n');
          const csvEndTime = performance.now();
          console.log(`✅ STANDARD CSV CONVERSION COMPLETE: ${csvEndTime - csvStartTime}ms for ${json.length} items`);
          return result;
        }
      }
      else {
        header = Object.keys(this.configuration.properties);
        const result = header.join(',');
        const csvEndTime = performance.now();
        console.log(`✅ EMPTY CSV CONVERSION COMPLETE: ${csvEndTime - csvStartTime}ms for empty dataset`);
        return result;
      }
    }
    else {
      let rows = [];
      let header;
      if (Object.keys(json).length > 0) {
        const entries = Object.entries(json);

        // Process in chunks for large datasets to prevent blocking
        if (entries.length > 500) { // Reduced from 5000 to 500 for more aggressive optimization
          console.log(`⚡ Using chunked KV CSV processing for ${entries.length} entries`);
          const result = this.processLargeObjectToCsv(entries);
          const csvEndTime = performance.now();
          console.log(`✅ CHUNKED KV CSV CONVERSION COMPLETE: ${csvEndTime - csvStartTime}ms for ${entries.length} entries`);
          return result;
        } else {
          console.log(`🏃 Using standard KV CSV processing for ${entries.length} entries`);
          for (let [key, val] of entries) {
            header = Object.keys(val);
            let row = header.map((key) => {
              const value = val[key];
              return `${value}`;
            }).join(',');
            row = key + ',' + row;
            rows.push(row)
          }
          header = (this.configuration.keyName ? this.configuration.keyName : 'Key') + ',' + header.join(',');
          const result = [header, ...rows].join('\n');
          const csvEndTime = performance.now();
          console.log(`✅ STANDARD KV CSV CONVERSION COMPLETE: ${csvEndTime - csvStartTime}ms for ${entries.length} entries`);
          return result;
        }
      }
      else {
        header = Object.keys(this.configuration.properties);
        header = (this.configuration.keyName ? this.configuration.keyName : 'Key') + ',' + header.join(',');
        const result = header;
        const csvEndTime = performance.now();
        console.log(`✅ EMPTY KV CSV CONVERSION COMPLETE: ${csvEndTime - csvStartTime}ms for empty dataset`);
        return result;
      }
    }
  }

  private processLargeArrayToCsv(json: any[], header: string[]): string {
    const chunkStartTime = performance.now();
    console.log(`🔄 LARGE ARRAY CSV CHUNKING START: Processing ${json.length} items in chunks of 1000`);

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

      // Log progress for large operations
      if (i % 5000 === 0) {
        console.log(`📊 CSV Chunk Progress: ${i + chunkSize}/${json.length} items processed`);
      }
    }

    const chunkEndTime = performance.now();
    console.log(`✅ LARGE ARRAY CSV CHUNKING COMPLETE: ${chunkEndTime - chunkStartTime}ms for ${json.length} items`);
    return result;
  }

  private processLargeObjectToCsv(entries: [string, any][]): string {
    const chunkStartTime = performance.now();
    console.log(`🔄 LARGE OBJECT CSV CHUNKING START: Processing ${entries.length} entries in chunks of 1000`);

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

      // Log progress for large operations
      if (i % 5000 === 0) {
        console.log(`📊 KV CSV Chunk Progress: ${i + chunkSize}/${entries.length} entries processed`);
      }
    }

    const headerRow = (this.configuration.keyName ? this.configuration.keyName : 'Key') + ',' + header.join(',');
    const result = [headerRow, ...rows].join('\n');

    const chunkEndTime = performance.now();
    console.log(`✅ LARGE OBJECT CSV CHUNKING COMPLETE: ${chunkEndTime - chunkStartTime}ms for ${entries.length} entries`);
    return result;
  }
}
