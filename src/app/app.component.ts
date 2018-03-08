import { Component, OnInit, HostListener, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { SidebarModule } from 'ng-sidebar';
import { SharedService } from './services/shared.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'app';
  @ViewChild('sidebar') sidebar: SidebarModule;
  navMode = 'side';

  constructor(private route: ActivatedRoute, private router: Router,
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef) { }
  public _opened: boolean = true;

  returnUrl: string;
  isUserLoggedIn = false;
  skip: boolean = false;

  public toggleSidebar() {
    if (this.navMode == 'over') {
      this._opened = !this._opened;
    }
  }

  ngOnInit() {
    this.sharedService.IsUserLoggedIn.subscribe(value => {
      this.isUserLoggedIn = value.loggedIn;
    });

    this.sharedService.IsLoginSkiped.subscribe(value => {
      this.skip = value;
    });

    if (window.innerWidth < 1024) {
      this.navMode = 'over';
      this._opened = false;
    }
  }

  ngAfterViewInit() {
    // get loggedin user from session
    let user = sessionStorage.getItem('currentUser');
    if (user != null && user.trim().length > 0) {
      this.isUserLoggedIn = true;
    }
    this.cdr.detectChanges();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    if (event.target.innerWidth < 1024) {
      this.navMode = 'over';
      this._opened = false;
    }
    if (event.target.innerWidth > 1024) {
      this.navMode = 'side';
      this._opened = true;
    }
  }
}
