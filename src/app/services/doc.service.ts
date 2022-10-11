import { Injectable } from '@angular/core';
import packageInfo from '../../../package.json';
import * as data from '../../git-version.json';

@Injectable({
  providedIn: 'root'
})
export class DocService {
  public gitDistance = data['default'].distance;
  public appVersion = data['default'].tag;
  public version = 'develop';
  constructor() {
    this.version = this?.gitDistance > 0 ? 'develop' : `${this?.appVersion}`;
  }

  goToLink() {
    window.open(`${packageInfo.doc_url}${this.version}`, '_blank');
  }

  goToPluginLink(pluginInfo: any) {
    const p = `fledge-${pluginInfo.type.toLowerCase()}-${pluginInfo.name}`;
    window.open(`${packageInfo.doc_url}${this.version}/plugins/${p}/index.html`, '_blank');
  }

  goToNotificationDocLink(slug: string) {
    window.open(`${packageInfo.doc_url}${this.version}/services/fledge-service-notification/index.html#${slug}`, '_blank');
  }

  goToSetPointControlDocLink(slug: string) {
    window.open(`${packageInfo.doc_url}${this.version}/control.html#${slug}`, '_blank');
  }

  goToViewQuickStartLink(slug: string) {
    window.open(`${packageInfo.doc_url}${this.version}/quick_start/${slug}`, '_blank');
  }

}
