import { Component, OnInit, Input, OnChanges, Output, EventEmitter, HostListener } from '@angular/core';
import { isEmpty } from 'lodash';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { ServicesApiService, AlertService, ProgressBarService } from '../../../services';

@Component({
  selector: 'app-plugin-modal',
  templateUrl: './plugin-modal.component.html',
  styleUrls: ['./plugin-modal.component.css']
})
export class PluginModalComponent implements OnInit, OnChanges {

  plugins = [];
  installButtonEnabled = true;
  pluginForm: FormGroup;
  stopLoading = false;
  placeholderText = 'fetching available plugins...';

  @Input() data: {
    modalState: boolean,
    type: string
  };
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();

  constructor(private service: ServicesApiService,
    private alertService: AlertService,
    private ngProgress: ProgressBarService) { }

  ngOnInit() {
    this.pluginForm = new FormGroup({
      pluginName: new FormControl({value: null, disabled: false}, Validators.required)
    });
  }

  ngOnChanges() {
    if (this.data.modalState === true) {
      this.toggleModal(true);
      this.getAvailablePlugins(this.data.type);
    }
  }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    this.toggleModal(false);
  }

  public toggleModal(isOpen: Boolean) {
    const modal = <HTMLDivElement>document.getElementById('plugin-modal');
    if (isOpen) {
      modal.classList.add('is-active');
      return;
    }
    this.notify.emit({
      modalState: !this.installButtonEnabled ? true : false,
      name: '',
      type: this.data.type.toLowerCase()
    });
    if (modal !== null) {
      modal.classList.remove('is-active');
    }
  }

  getAvailablePlugins(type: string) {
    this.service.getAvailablePlugins(type).
      subscribe(
        (data: any) => {
          this.installButtonEnabled = true;
          this.plugins = data['plugins'].map((p: string) => p.replace(`foglamp-${this.data.type.toLowerCase()}-`, ''));
          this.placeholderText = 'Select Plugin';
          if (isEmpty(this.plugins)) {
            this.stopLoading = true;
            this.alertService.warning('No plugin available to install');
          }
        },
        error => {
          this.stopLoading = true;
          this.placeholderText = 'Select Plugin';
          if (error.status === 0) {
            console.log('service down ', error);
          } else if (error.status === 404) {
            this.alertService.error('Make sure package repository is configured / added in FogLAMP');
          } else {
            let errorText = error.statusText;
            if (typeof error.error.link === 'string') {
              errorText += ` <a>${error.error.link}</a>`;
            }
            this.alertService.error(errorText);
          }
        }
      );
  }

  installPlugin(pluginName: string) {
    this.installButtonEnabled = false;
    if (pluginName === undefined || pluginName === null) {
      this.installButtonEnabled = true;
      return;
    }
    const pluginData = {
      format: 'repository',
      name: `foglamp-${this.data.type.toLowerCase()}-` + pluginName,
      version: ''
    };

    /** request started */
    this.ngProgress.start();
    this.pluginForm.controls.pluginName.disable();
    this.alertService.activityMessage('Installing ' + pluginName + ' ' + this.data.type.toLowerCase() + ' plugin...', true);
    this.service.installPlugin(pluginData).
      subscribe(
        (data: any) => {
          /** request done */
          this.ngProgress.done();
          this.toggleModal(false);
          this.alertService.closeMessage();
          this.alertService.success(data.message, true);
          this.installButtonEnabled = false;
          this.pluginForm.controls.pluginName.enable();
        },
        error => {
          /** request done */
          this.ngProgress.done();
          this.pluginForm.controls.pluginName.enable();
          this.installButtonEnabled = true;
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            let errorText = error.statusText;
            if (typeof error.error.link === 'string') {
              errorText += ` <a>${error.error.link}</a>`;
            }
            this.alertService.error(errorText);
          }
        },
        () => {
          this.notify.emit({
            modalState: false,
            pluginInstall: true,
            type: this.data.type.toLowerCase(),
            name: pluginName
          });
        });
  }
}
