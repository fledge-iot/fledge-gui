import { Component, OnInit, HostListener, ViewChild } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { SidebarModule } from 'ng-sidebar';
import { PingService, ServicesHealthService } from './services/index';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'app';
  @ViewChild('sidebar') sidebar: SidebarModule;
  navMode = 'side';

  public _opened = true;
  public returnUrl: string;
  public isLoginView = false;

  constructor(private router: Router,
    private ping: PingService,
    private servicesHealthService: ServicesHealthService) { }

  public toggleSidebar() {
    if (this.navMode === 'over') {
      this._opened = !this._opened;
    }
  }

  ngOnInit() {
    if (window.innerWidth < 1024) {
      this.navMode = 'over';
      this._opened = false;
    }
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.isActive(event.url);
      }
    });
    this.ping.setDefaultPingTime();
    const pingInterval = JSON.parse(localStorage.getItem('PING_INTERVAL'));
    this.ping.pingIntervalChanged.next(pingInterval);
    this.onLaunchAppRedirect();
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

  isActive(href) {
    if (href === '/login' || href === '/setting?id=1' || href.indexOf('user/reset-password') >= 0) {
      return this.isLoginView = true;
    } else {
      return this.isLoginView = false;
    }
  }

  onLaunchAppRedirect() {
    // Get ping service data on app launch
    if (this.servicesHealthService.pingData) {
      const auth = this.servicesHealthService.pingData.authenticationOptional;
      sessionStorage.setItem('LOGIN_SKIPPED', auth);
      if (auth) {
        this.router.navigate(['']);
      } else if (sessionStorage.getItem('token') == null && !auth) {
        this.router.navigate(['/login']);
      }
    } else {
      this.router.navigate(['/setting'], { queryParams: { id: '1' } });
    }
  }
}
