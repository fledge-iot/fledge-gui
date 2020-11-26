import { Injectable } from '@angular/core';
import { version, doc_url } from '../../../package.json';

@Injectable({
  providedIn: 'root'
})
export class DocService {

  goToLink() {
    const v = version.includes('next') ? 'develop' : `v${version}`;
    window.open(`${doc_url}${v}`, '_blank');
  }

  goToPluginLink(pluginInfo: any) {
    const v = version.includes('next') ? 'develop' : `v${version}`;
    const p = `fledge-${pluginInfo.type.toLowerCase()}-${pluginInfo.name.toLowerCase()}`;
    window.open(`${doc_url}${v}/plugins/${p}/index.html`, '_blank');
  }

  goToNotificationDocLink() {
    const v = version.includes('next') ? 'develop' : `v${version}`;
    window.open(`${doc_url}${v}/notifications.html`, '_blank');
  }

}
