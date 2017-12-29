import { Component, OnInit, HostListener, ViewChild } from '@angular/core';
import { SidebarModule } from 'ng-sidebar';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'app';
  @ViewChild('sidebar') sidebar: SidebarModule;
  navMode = 'side';
  constructor() { }

  public _opened: boolean = true;

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

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    console.log('resize');
    if (event.target.innerWidth < 1024) {
      console.log('mobile');
      this.navMode = 'over';
      this._opened = false;
    }
    if (event.target.innerWidth > 1024) {
      console.log('desktop');
      this.navMode = 'side';
      this._opened = true;
    }
  }
}
