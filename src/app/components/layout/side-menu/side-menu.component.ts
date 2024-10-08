import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { LookupService } from '../../../microfrontend/lookup.service';
import { Microfrontend } from '../../../microfrontend/microfrontend';
import { DocService } from '../../../services/doc.service';
import { SharedService } from '../../../services/shared.service';
import { buildRoutes } from '../../../../menu-utils';
import { DeveloperFeaturesService } from '../../../services/developer-features.service';
import { RolesService } from '../../../services';
import { Subject } from 'rxjs';
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

    this.sharedService.viewport
      .pipe(takeUntil(this.destroySubject))
      .subscribe(viewport => {
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

  openSubmenuOnHover(menuLink) {
    if (this.viewPort !== 'desktop') {
      return;
    }
    let sidemenuLink = document.getElementById(menuLink + '-li') as HTMLDivElement;
    let submenuWrapper = document.getElementById(menuLink + '-submenu') as HTMLDivElement;

    // grab the menu item's position relative to its positioned parent
    var menuItemPosition = sidemenuLink.getBoundingClientRect();

    // To adjust the submenu position properly according to the available space at top/bottom
    const spaceBelow = window.innerHeight - menuItemPosition.bottom;
    const spaceAbove = menuItemPosition.top;
    let addedMargin = 55;
    if (spaceBelow < 100) {
      addedMargin = 170;
    }
    if (spaceAbove < 55) {
      addedMargin = 0;
    }

    // place the submenu in the correct position relevant to the menu item
    submenuWrapper.style.top = (menuItemPosition.top - addedMargin).toString() + 'px';
    submenuWrapper.style.left = (menuItemPosition.width + 4).toString() + 'px';
    setTimeout(function () {
      submenuWrapper.classList.add('show');
      this.toggleSubmenuState(menuLink);
    }.bind(this), 200);
  }

  toggleSubmenuOnClick(menuLink, event = null) {
    const menuOption = document.getElementById(menuLink + '-submenu') as HTMLDivElement;
    if (this.viewPort == 'desktop') {
      return;
    }
    this.toggleSubmenuState(menuLink, !menuOption.classList.contains('show'));
    menuOption.classList.toggle('show');
    event.stopPropagation()
  }

  closeSubmenu(menuLink) {
    if (this.viewPort !== 'desktop') {
      return;
    }
    const menuOption = document.getElementById(menuLink + '-submenu') as HTMLDivElement;
    setTimeout(function () {
      // If mouse is over the menu or child sub-menu then return and don't close the sub-menu   
      if (menuOption.matches(':hover')) {
        return;
      }
      menuOption.classList.remove('show');

      this.toggleSubmenuState(menuLink, false);
    }.bind(this), 200);
  }

  toggleSubmenuState(menuLink, state = null) {
    let controlSubmenu = document.getElementById('control-submenu') as HTMLDivElement;
    let logsSubmenu = document.getElementById('logs-submenu') as HTMLDivElement;

    switch (menuLink) {
      case 'control':
        this.isControlListOpen = state ? state : !this.isControlListOpen;

        // On mobile/tablet view, close other submenu/s if open
        if (this.viewPort !== 'desktop' && state) {
          this.isLogsListOpen = this.isLogsListOpen ? false : this.isLogsListOpen;
          logsSubmenu.classList.remove('show');

          if (this.developerFeaturesService.getDeveloperFeatureControl()) {
            let developerSubmenu = document.getElementById('developer-submenu') as HTMLDivElement;
            this.isDeveloperListOpen = this.isDeveloperListOpen ? false : this.isLogsListOpen;
            developerSubmenu.classList.remove('show');
          }
        }
        break;
      case 'logs':
        this.isLogsListOpen = state ? state : !this.isLogsListOpen;

        // On mobile/tablet view, close other submenu/s if open
        if (this.viewPort !== 'desktop' && state) {
          this.isControlListOpen = this.isControlListOpen ? false : this.isControlListOpen;
          controlSubmenu.classList.remove('show');

          if (this.developerFeaturesService.getDeveloperFeatureControl()) {
            let developerSubmenu = document.getElementById('developer-submenu') as HTMLDivElement;
            this.isDeveloperListOpen = this.isDeveloperListOpen ? false : this.isDeveloperListOpen;
            developerSubmenu.classList.remove('show');
          }
        }
        break;
      case 'developer':
        this.isDeveloperListOpen = state ? state : !this.isDeveloperListOpen;

        // On mobile/tablet view, close other submenu/s if open
        if (this.viewPort !== 'desktop' && state) {
          this.isControlListOpen = this.isControlListOpen ? false : this.isControlListOpen;
          controlSubmenu.classList.remove('show');
          this.isLogsListOpen = this.isLogsListOpen ? false : this.isLogsListOpen;
          logsSubmenu.classList.remove('show');
        }
        break;
      default:
        break;
    }
  }

  applyCssClass(menuState) {
    if (this.viewPort == 'desktop') {
      return 'fa-chevron-right';
    } else {
      let cssClass = menuState ? 'fa-chevron-down' : 'fa-chevron-right';
      return cssClass;
    }
  }

  ngOnDestroy() {
    // Unsubscribe from all observables
    this.destroySubject.next();
    this.destroySubject.unsubscribe();
  }
}
