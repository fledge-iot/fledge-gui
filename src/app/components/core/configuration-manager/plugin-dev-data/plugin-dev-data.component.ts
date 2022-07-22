import { Component, Input, OnInit } from '@angular/core';
import { DialogService } from '../../../common/confirmation-dialog/dialog.service';
import { AlertService, ProgressBarService } from '../../../../services';
import { PluginDataService } from './plugin-data.service';

@Component({
  selector: 'app-plugin-dev-data',
  templateUrl: './plugin-dev-data.component.html',
  styleUrls: ['./plugin-dev-data.component.css']
})
export class PluginDevDataComponent implements OnInit {
  @Input() serviceName;
  @Input() pluginName;
  public pluginData;
  public isJsonExtension = true;
  public selectedTheme = 'default';

  constructor(
    public pluginDataService: PluginDataService,
    private alertService: AlertService,
    private dialogService: DialogService,
    public ngProgress: ProgressBarService) { }

  ngOnInit(): void {
    console.log('serviceName', this.serviceName);
    console.log('pluginName', this.pluginName);
    this.getData();
  }

  getData() {
    /** request started */
    this.ngProgress.start();
    this.pluginDataService.getData(this.serviceName, this.pluginName)
      .subscribe(
        (res: any) => {
          console.log('data', res.data);
          this.pluginData = res.data;
          /** request completed */
          this.ngProgress.done();
        },
        error => {
          /** request completed but error */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  openModal(id: string) {
    this.dialogService.open(id);
  }

  closeModal(id: string) {
    this.dialogService.close(id);
  }

  onPluginDataFileChange(event: any) {
    this.pluginData = '';
    if (event.target.files.length !== 0) {
      const fileName = event.target.files[0].name;
      const ext = fileName.substr(fileName.lastIndexOf('.') + 1);
      if (ext !== 'json') {
        this.isJsonExtension = false;
        return;
      }
      this.isJsonExtension = true;
      if (event.target.files.length > 0) {
        const file = event.target.files[0];
        const fileReader = new FileReader();
        fileReader.readAsText(file);
        fileReader.onload = () => {
          this.pluginData = fileReader.result;
        };
      }
    }
  }


  exportPluginData(pluginData: any) {
    const str = JSON.stringify(pluginData);
    const bytes = new TextEncoder().encode(str);
    const blob = new Blob([bytes], {
      type: "application/json;charset=utf-8"
    });
    const url = window.URL.createObjectURL(blob);
    // create a custom anchor tag
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.serviceName}_${this.pluginName}_data`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  importPluginData() {
    const payload = { data: JSON.parse(JSON.stringify(this.pluginData)) };
    console.log('plugin data', payload);
    /** request started */
    this.ngProgress.start();
    this.pluginDataService.importData(this.serviceName, this.pluginName, payload)
      .subscribe(
        (data: any) => {
          this.pluginData = data.result;
          this.alertService.success(data.result);
          /** request completed */
          this.ngProgress.done();
          this.closeModal('import-plugin-data-dialog')
        },
        error => {
          /** request completed but error */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  deleteData() {
    /** request started */
    this.ngProgress.start();
    this.pluginDataService.deleteData(this.serviceName, this.pluginName)
      .subscribe(
        (data: any) => {
          console.log('data', data);
          this.alertService.success(data.result);
          /** request completed */
          this.ngProgress.done();
        },
        error => {
          /** request completed but error */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

}
