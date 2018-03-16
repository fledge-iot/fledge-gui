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
    private cdr: ChangeDetectorRef) { 
      this.sharedService.isUserLoggedIn.subscribe(value => {
        this.isUserLoggedIn = value.loggedIn;
      });
  
      this.sharedService.isLoginSkiped.subscribe(value => {
        this.skip = value;
      });
  
    }
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
    if (window.innerWidth < 1024) {
      this.navMode = 'over';
      this._opened = false;
    }
  }

  ngAfterViewInit() {
    // get loggedin user token from session
    const token = sessionStorage.getItem('token');
    const skip = sessionStorage.getItem('skip');
    if (token != null && token.trim().length > 0) {
      this.isUserLoggedIn = true;
    } else if( skip != null && skip.trim().length > 0) {
      this.skip = true;
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
