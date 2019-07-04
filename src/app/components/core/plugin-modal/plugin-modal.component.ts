import { Component, OnInit, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { isEmpty } from 'lodash';

import { ServicesApiService, AlertService, ProgressBarService } from '../../../services';


@Component({
  selector: 'app-plugin-modal',
  templateUrl: './plugin-modal.component.html',
  styleUrls: ['./plugin-modal.component.css']
})
export class PluginModalComponent implements OnInit, OnChanges {

  plugins = [];
  config = {
    search: true,
    height: '200px',
    placeholder: 'Select',
    limitTo: this.plugins.length,
    moreText: 'more', // text to be displayed when more than one items are selected like Option 1 + 5 more
    noResultsFound: 'No plugin found!',
    searchPlaceholder: 'Search',
  };

  installButtonEnabled = true;

  @Input() data: {
    modalState: boolean,
    type: string
  };
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();

  constructor(private service: ServicesApiService,
    private alertService: AlertService,
    private ngProgress: ProgressBarService) { }

  ngOnInit() { }

  ngOnChanges() {
    if (this.data.modalState === true) {
      this.toggleModal(true);
      this.getAvailablePlugins(this.data.type);
    }
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

  fetchPluginRequestStarted() {
    this.ngProgress.start();
    const requestInProgressEle: HTMLElement = document.getElementById('requestInProgress') as HTMLElement;
    requestInProgressEle.innerHTML = 'fetching available plugins ...';
  }

  fetchPluginRequestDone() {
    this.ngProgress.done();
    if (this.plugins.length) {
      const ddnEle: HTMLElement = document.getElementsByClassName('ngx-dropdown-button')[0] as HTMLElement;
      if (ddnEle !== undefined) {
        ddnEle.click();
      }
    }

    const requestInProgressEle: HTMLElement = document.getElementById('requestInProgress') as HTMLElement;
    if (requestInProgressEle !== null) {
      requestInProgressEle.innerHTML = '';
    }
  }

  getAvailablePlugins(type: string) {
    this.fetchPluginRequestStarted();
    this.service.getAvailablePlugins(type).
      subscribe(
        (data: any) => {
          this.installButtonEnabled = true;
          this.plugins = data['plugins'].map((p: string) => p.replace(`foglamp-${this.data.type.toLowerCase()}-`, ''));
          if (isEmpty(this.plugins)) {
            this.alertService.warning('No plugin available to install');
          }
          setTimeout(() => {
            this.fetchPluginRequestDone();
          }, 100);
        },
        error => {
          this.fetchPluginRequestDone();
          if (error.status === 0) {
            console.log('service down ', error);
          } else if (error.status === 404) {
            this.alertService.error('Make sure package repository is configured / added in FogLAMP');
          } else {
            this.alertService.error(error.statusText);
          }
        }
      );
  }

  installPlugin(pluginName: string) {
    this.installButtonEnabled = false;
    if (pluginName === undefined) {
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
    this.alertService.activityMessage('installing ...', true);
    this.service.installPlugin(pluginData).
      subscribe(
        (data: any) => {
          /** request done */
          this.ngProgress.done();
          this.toggleModal(false);
          this.alertService.closeMessage();
          this.alertService.success(data.message, true);
          this.installButtonEnabled = false;
        },
        error => {
          /** request done */
          this.ngProgress.done();
          this.installButtonEnabled = true;
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
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
