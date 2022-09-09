import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { LookupService } from '../../../microfrontend/lookup.service';
import { Microfrontend } from '../../../microfrontend/microfrontend';
import { DocService } from '../../../services/doc.service';
import { SharedService } from '../../../services/shared.service';
import { buildRoutes } from '../../../../menu-utils';
import { DeveloperFeaturesService } from '../../../services/developer-features.service';

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.css']
})
export class SideMenuComponent implements OnInit {
  public step = '';
  @Output() toggle: EventEmitter<any> = new EventEmitter();
  microfrontends: Microfrontend[] = [];

  isAdmin = false;
  constructor(
    private router: Router,
    private docService: DocService,
    private sharedService: SharedService,
    private lookupService: LookupService,
    public developerFeaturesService: DeveloperFeaturesService,
  ) { }

  async ngOnInit() {
    this.microfrontends = await this.lookupService.lookup();
    const routes = buildRoutes(this.microfrontends);
    // reconfigure routes after dyanmic route load
    this.router.resetConfig(routes);

    this.sharedService.isAdmin.subscribe(value => {
      this.isAdmin = value;
    });
  }


  goToLink() {
    this.docService.goToLink();
  }
}
