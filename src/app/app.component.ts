import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { PingService } from './services';
import { SharedService } from './services/shared.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'app';
  navMode = 'side';

  public _opened = true;
  public returnUrl: string;
  public url: string;
  public isLoginView = false;

  isServiceRunning = true;
  modalWindow: HTMLElement | null;

  isSidemenuCollapsed = false;

  private destroySubject: Subject<void> = new Subject();

  constructor(private router: Router,
    private ping: PingService,
    private sharedService: SharedService) { }


  @ViewChild('navBurger') navBurger: ElementRef;
  @ViewChild('navMenu') navMenu: ElementRef;

  public toggleSidebar() {
    if (this.navMode === 'over') {
      this._opened = !this._opened;
    }
  }

  async ngOnInit() {
    if (window.innerWidth < 1024) {
      this.navMode = 'over';
      this._opened = false;
    }
    this.sharedService.loginScreenSubject
      .pipe(takeUntil(this.destroySubject))
      .subscribe((isLoginView: boolean) => {
        this.isLoginView = isLoginView;
      })

    this.setPingIntervalOnAppLaunch();
    this.setStasHistoryGraphRefreshIntervalOnAppLaunch();
    this.router.events
      .pipe(takeUntil(this.destroySubject))
      .subscribe(event => {
        if (event instanceof NavigationEnd) {
          this.isActive(event.url);
        }
      });

    this.sharedService.connectionInfo
      .pipe(takeUntil(this.destroySubject))
      .subscribe(connectionInfo => {
        if (connectionInfo) {
          this.modalWindow = document.querySelector('.modal.is-active');
          let modalCard = this.modalWindow?.querySelector('.modal-card');
          if (!connectionInfo?.isServiceUp) {
            if (this.modalWindow) {
              this.modalWindow?.classList.add('modal-disabled');
              modalCard.classList.add('blur');
            }
          } else {
            this.modalWindow?.classList.remove('modal-disabled');
            modalCard?.classList.remove('blur');
          }
          this.isServiceRunning = connectionInfo?.isServiceUp;
        }
      });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    if (event.target.innerWidth < 1024) {
      this.navMode = 'over';
      this._opened = false;
    }
    if (event.target.innerWidth >= 1024) {
      this.navMode = 'side';
      this._opened = true;
    }
  }

  /**
   * Returns isLoginView by setting it's value
   *
   * @remarks
   * In this method, we set the value of isLoginView variable
   * Set true, if route is without sidebar OR token is missing when auth is mandatory, otherwise set it to false
   *
   * Here-
   * URL having /setting?id=1 means Settings page without sidebar
   * URL having user/reset-password is to handle password expiry
   * @param href - URL of the page
   * @returns isLoginView
   *
   */
  isActive(href) {
    this.url = this.router?.url;
    const withoutSidebarRoutes = (href.includes('/login') || href.includes('/setting?id=1') || href.indexOf('user/reset-password') >= 0);
    const tokenMissingWhenAuthMandatory = sessionStorage.getItem('token') === null && !JSON.parse(sessionStorage.getItem('LOGIN_SKIPPED'));
    if (withoutSidebarRoutes || tokenMissingWhenAuthMandatory) {
      return this.isLoginView = true;
    } else {
      return this.isLoginView = false;
    }
  }

  setPingIntervalOnAppLaunch() {
    this.url = this.router?.url;
    this.ping.setDefaultPingTime();
    const pingInterval = JSON.parse(localStorage.getItem('PING_INTERVAL'));
    this.ping.pingIntervalChanged.next(pingInterval);
  }

  setStasHistoryGraphRefreshIntervalOnAppLaunch() {
    this.ping.setDefaultRefreshGraphTime();
    const refreshInterval = JSON.parse(localStorage.getItem('DASHBOARD_GRAPH_REFRESH_INTERVAL'));
    this.ping.refreshIntervalChanged.next(refreshInterval);
  }

  setSidebarState(state) {
    this.isSidemenuCollapsed = state;
  }

  ngOnDestroy() {
    // Unsubscribe from all observables
    this.destroySubject.next();
    this.destroySubject.unsubscribe();
  }
}

