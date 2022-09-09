import { Injectable } from '@angular/core';
import packageInfo from '../../../package.json';

@Injectable({
  providedIn: 'root'
})
export class DocService {

  goToLink() {
    const v = packageInfo.version.includes('next') ? 'develop' : `v${packageInfo.version}`;
    window.open(`${packageInfo.doc_url}${v}`, '_blank');
  }

  goToPluginLink(pluginInfo: any) {
    const v = packageInfo.version.includes('next') ? 'develop' : `v${packageInfo.version}`;
    const p = `fledge-${pluginInfo.type.toLowerCase()}-${pluginInfo.name}`;
    window.open(`${packageInfo.doc_url}${v}/plugins/${p}/index.html`, '_blank');
  }

  goToNotificationDocLink(slug: string) {
    const v = packageInfo.version.includes('next') ? 'develop' : `v${packageInfo.version}`;
    window.open(`${packageInfo.doc_url}${v}/services/fledge-service-notification/index.html#${slug}`, '_blank');
  }

  goToSetPointControlDocLink(slug: string) {
    const v = packageInfo.version.includes('next') ? 'develop' : `v${packageInfo.version}`;
    window.open(`${packageInfo.doc_url}${v}/control.html#${slug}`, '_blank');
  }

  goToViewQuickStartLink(slug: string) {
    const v = packageInfo.version.includes('next') ? 'develop' : `v${packageInfo.version}`;
    window.open(`${packageInfo.doc_url}${v}/quick_start/${slug}`, '_blank');
  }

}
