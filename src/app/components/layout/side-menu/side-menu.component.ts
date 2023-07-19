import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { LookupService } from '../../../microfrontend/lookup.service';
import { Microfrontend } from '../../../microfrontend/microfrontend';
import { DocService } from '../../../services/doc.service';
import { SharedService } from '../../../services/shared.service';
import { buildRoutes } from '../../../../menu-utils';
import { DeveloperFeaturesService } from '../../../services/developer-features.service';
import { RolesService, } from '../../../services';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.css']
})
export class SideMenuComponent implements OnInit {
  public step = '';
  @Output() toggle: EventEmitter<any> = new EventEmitter();
  microfrontends: Microfrontend[] = [];

  isLogsListOpen = false;
  isControlListOpen = false;
  isAdmin = false;
  isServiceRunning = true;
  private destroySubject: Subject<void> = new Subject();

  constructor(
    private router: Router,
    private docService: DocService,
    private sharedService: SharedService,
    private lookupService: LookupService,
    public developerFeaturesService: DeveloperFeaturesService,
    public rolesService: RolesService
  ) { }

  async ngOnInit() {
    this.microfrontends = await this.lookupService.lookup();
    const routes = buildRoutes(this.microfrontends);
    // reconfigure routes after dyanmic route load
    this.router.resetConfig(routes);

    this.sharedService.isAdmin
      .pipe(takeUntil(this.destroySubject))
      .subscribe(value => {
        this.isAdmin = value;
      });

    // Check whether the service is up or not
    this.sharedService.connectionInfo
      .pipe(takeUntil(this.destroySubject))
      .subscribe(connectionInfo => {
        this.isServiceRunning = connectionInfo?.isServiceUp;
      });
  }

  public toggleDropdown(id) {
    const dropdownMenuItems = <HTMLDivElement>document.getElementById(id);
    if (dropdownMenuItems.classList.contains('hide')) {
      dropdownMenuItems.classList.add('show');
      dropdownMenuItems.classList.remove('hide');
      return;
    }
    dropdownMenuItems.classList.remove('show');
    dropdownMenuItems.classList.add('hide');
  }

  goToLink() {
    this.docService.goToLink();
  }

  ngOnDestroy() {
    // Unsubscribe from all observables
    this.destroySubject.next();
    this.destroySubject.unsubscribe();
  }
}
