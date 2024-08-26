import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { LookupService } from '../../../microfrontend/lookup.service';
import { Microfrontend } from '../../../microfrontend/microfrontend';
import { DocService } from '../../../services/doc.service';
import { SharedService } from '../../../services/shared.service';
import { buildRoutes } from '../../../../menu-utils';
import { DeveloperFeaturesService } from '../../../services/developer-features.service';
import { RolesService } from '../../../services';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FlowEditorService } from '../../common/node-editor/flow-editor.service';

declare let $: any;

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.css']
})
export class SideMenuComponent implements OnInit {
  public step = '';
  @Output() toggle: EventEmitter<any> = new EventEmitter();
  @Output() sidebarCollapsedEvent: EventEmitter<any> = new EventEmitter();
  microfrontends: Microfrontend[] = [];

  isLogsListOpen = false;
  isControlListOpen = false;
  isDeveloperListOpen = false;
  isAdmin = false;
  isServiceRunning = true;
  private destroySubject: Subject<void> = new Subject();
  private viewPortSubscription: Subscription;
  viewPort: any = '';

  isSidemenuCollapsed = false;

  toggleSideMenu() {
    this.toggle.next('toggleSidebar');
  }

  constructor(
    private router: Router,
    private docService: DocService,
    private sharedService: SharedService,
    private lookupService: LookupService,
    public developerFeaturesService: DeveloperFeaturesService,
    public rolesService: RolesService,
    public flowEditorService: FlowEditorService
  ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        // handle NavigationEnd event here
        this.isLogsListOpen = event.url.includes('logs');
        this.isControlListOpen = event.url.includes('control-dispatcher');
      }
    });
  }

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
    this.viewPortSubscription = this.sharedService.viewport.subscribe(viewport => {
      this.viewPort = viewport;
    });
  }

  goToLink() {
    this.docService.goToLink();
  }

  toggleSidemenuState() {
    let sidemenu = document.getElementById('sidemenu') as HTMLDivElement;
    sidemenu.classList.toggle('collapsed');
    this.isSidemenuCollapsed = !this.isSidemenuCollapsed;
    this.sidebarCollapsedEvent.emit(this.isSidemenuCollapsed);
  }

  openSubmenu(menuLink) {
    let sidemenuLink = document.getElementById(menuLink + '-li') as HTMLDivElement;
    let submenuWrapper = document.getElementById(menuLink + '-submenu') as HTMLDivElement;

    // grab the menu item's position relative to its positioned parent
    var menuItemPosition = sidemenuLink.getBoundingClientRect();

    // place the submenu in the correct position relevant to the menu item
    submenuWrapper.style.top = (menuItemPosition.top - 50).toString() + 'px';
    submenuWrapper.style.left = menuItemPosition.width.toString() + 'px';
    this.toggleSubmenuState(menuLink, true);
  }

  closeSubmenu(menuLink) {
    const menuOption = document.getElementById(menuLink + '-submenu') as HTMLDivElement;
    // If mouse is over the menu or sub-menu then return and don't close the sub-menu   
    if (menuOption.matches(':hover')) {
      return;
    }
    this.toggleSubmenuState(menuLink, false);
    menuOption.style.display = 'none';
  }

  toggleSubmenuState(menuLink, state) {
    switch (menuLink) {
      case 'control':
        this.isControlListOpen = state;
        break;
      case 'logs':
        this.isLogsListOpen = state;
        break;
      case 'developer':
        this.isDeveloperListOpen = state;
        break;
      default:
        break;
    }
  }

  ngOnDestroy() {
    // Unsubscribe from all observables
    this.destroySubject.next();
    this.destroySubject.unsubscribe();
    this.viewPortSubscription.unsubscribe();
  }
}
