import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { DialogService } from '../../../common/confirmation-dialog/dialog.service';
import { AlertService, ProgressBarService, RolesService } from '../../../../services';
import { PluginPersistDataService } from './plugin-persist-data.service';

@Component({
  selector: 'app-plugin-persist-data',
  templateUrl: './plugin-persist-data.component.html',
  styleUrls: ['./plugin-persist-data.component.css']
})
export class PluginPersistDataComponent implements OnInit {
  @Input() serviceName;
  @Input() pluginName;
  @Input() serviceStaus = false;
  public pluginData = '';
  public pluginDataToImport = '';
  public isJsonExtension;
  public jsonParseError = false;
  public plugins = [];
  noPersistDataMessage = '';

  @ViewChild('fileInput') fileInput: ElementRef;

  constructor(
    public pluginDataService: PluginPersistDataService,
    private alertService: AlertService,
    private dialogService: DialogService,
    public ngProgress: ProgressBarService,
    public rolesService: RolesService) { }

  ngOnInit(): void {
    this.getPlugins();
  }

  getPlugins() {
    /** request started */
    this.ngProgress.start();
    this.pluginDataService.getPlugins(this.serviceName)
      .subscribe(
        (res: any) => {
          this.plugins = res.persistent;
          /** request completed */
          this.ngProgress.done();
          if (this.plugins.length > 0) {
            this.getData(this.plugins[0]); // show data of the first plugin in the list
          }
        },
        error => {
          /** request completed but error */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else if (error.status == 404) {
            this.noPersistDataMessage = error.statusText;
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  getData(pluginName: string) {
    this.pluginData = '';
    this.noPersistDataMessage = '';
    this.pluginName = pluginName;
    /** request started */
    this.ngProgress.start();
    this.pluginDataService.getData(this.serviceName, pluginName)
      .subscribe(
        (res: any) => {
          this.pluginData = res.data;
          /** request completed */
          this.ngProgress.done();
        },
        error => {
          /** request completed but error */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else if (error.status == 404) {
            this.noPersistDataMessage = error.statusText;
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
    this.pluginDataToImport = '';
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
          this.pluginDataToImport = JSON.parse(JSON.stringify(fileReader.result));
        };
      }
    }
  }

  exportPluginData(pluginData) {
    const str = JSON.stringify(pluginData);
    const bytes = new TextEncoder().encode(str);
    const blob = new Blob([bytes], {
      type: "application/json;charset=utf-8"
    });
    const url = window.URL.createObjectURL(blob);
    const fileName = `${this.serviceName.replace(/ /g, '_')}_${this.pluginName.replace(/ /g, '_')}_data`;
    // create a custom anchor tag
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName; //`${this.serviceName}_${this.pluginName}_data`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  importPluginData() {
    try {
      const jsonValue = JSON.parse(this.pluginDataToImport);
      const payload = { data: jsonValue };
      this.jsonParseError = false;
      /** request started */
      this.ngProgress.start();
      this.pluginDataService.importData(this.serviceName, this.pluginName, payload)
        .subscribe(
          (data: any) => {
            this.alertService.success(data.result);
            /** request completed */
            this.ngProgress.done();
            this.closeModal('import-plugin-data-dialog');
            this.getData(this.pluginName);
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
    } catch (ex) {
      this.jsonParseError = true;
    }
  }

  deleteData() {
    /** request started */
    this.ngProgress.start();
    this.pluginDataService.deleteData(this.serviceName, this.pluginName)
      .subscribe(
        (data: any) => {
          this.alertService.success(data.result);
          /** request completed */
          this.ngProgress.done();
          this.closeModal('delete-plugin-data-confirmation-dialog');
          this.getData(this.pluginName);
          this.resetFileControl();
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

  resetFileControl() {
    if (this.fileInput) {
      this.fileInput.nativeElement.value = "";
      this.pluginDataToImport = '';
      this.isJsonExtension = false;
      this.jsonParseError = false;
    }
  }
}
