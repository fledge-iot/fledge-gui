import { Injectable } from '@angular/core';
import packageInfo from '../../../package.json';
import * as data from '../../git-version.json';

@Injectable({
  providedIn: 'root'
})
export class DocService {
  public gitDistance = data['default'].distance;
  public appVersion = data['default'].tag;

  constructor() { }

  goToLink() {
    const v = this.gitDistance > 0 ? 'develop' : `${this.appVersion}`;
    window.open(`${packageInfo.doc_url}${v}`, '_blank');
  }

  goToPluginLink(pluginInfo: any) {
    const v = this.gitDistance > 0 ? 'develop' : `${this.appVersion}`;
    const p = `fledge-${pluginInfo.type.toLowerCase()}-${pluginInfo.name}`;
    window.open(`${packageInfo.doc_url}${v}/plugins/${p}/index.html`, '_blank');
  }

  goToNotificationDocLink(slug: string) {
    const v = this.gitDistance > 0 ? 'develop' : `${this.appVersion}`;
    window.open(`${packageInfo.doc_url}${v}/services/fledge-service-notification/index.html#${slug}`, '_blank');
  }

  goToSetPointControlDocLink(slug: string) {
    const v = packageInfo.version.includes('next') ? 'develop' : `v${packageInfo.version}`;
    window.open(`${packageInfo.doc_url}${v}/control.html#${slug}`, '_blank');
  }

  goToViewQuickStartLink(slug: string) {
    const v = this.gitDistance > 0 ? 'develop' : `${this.appVersion}`;
    window.open(`${packageInfo.doc_url}${v}/quick_start/${slug}`, '_blank');
  }

}
