import { Injectable } from '@angular/core';
import packageInfo from '../../../package.json';
import * as data from '../../git-version.json';

@Injectable({
  providedIn: 'root'
})
export class DocService {
  private gitDistance = data['default'].distance;
  private appVersion = data['default'].tag;
  private version = 'develop'; //readthedocs version to use
  constructor() {
    if (this.gitDistance == 0) {
      this.version = this.appVersion;
    }
  }

  goToLink() {
    window.open(`${packageInfo.doc_url}${this.version}`, '_blank');
  }

  goToPluginLink(pluginInfo: any) {
    const p = `fledge-${pluginInfo.type.toLowerCase()}-${pluginInfo.name}`;
    window.open(`${packageInfo.doc_url}${this.version}/plugins/${p}/index.html`, '_blank');
  }

  goToServiceDocLink(slug: string, repoName: string = null) {
    window.open(`${packageInfo.doc_url}${this.version}/services/${repoName}/index.html#${slug}`, '_blank');
  }

  goToSetPointControlDocLink(slug: string) {
    window.open(`${packageInfo.doc_url}${this.version}/control.html#${slug}`, '_blank');
  }

  goToViewQuickStartLink(slug: string) {
    window.open(`${packageInfo.doc_url}${this.version}/quick_start/${slug}`, '_blank');
  }

}
