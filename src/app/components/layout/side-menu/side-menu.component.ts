import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.css']
})
export class SideMenuComponent implements OnInit {
  public step = '';
  @Output() toggle: EventEmitter<any> = new EventEmitter();

  isAdmin = false;
  isSkip = false;
  constructor(private router: Router) { }

  ngOnInit() {
    this.isAdmin = JSON.parse(sessionStorage.getItem('isAdmin'));
    this.isSkip = JSON.parse(sessionStorage.getItem('skip'));
    this.router.events.subscribe(() => {
      if (this.router.url === '/' || this.router.url === '/dashboard') {
        this.step = '/dashboard';
      } else {
        this.step = this.router.url;
      }
    });
  }

  onToggle(step) {
    this.step = step;
    this.router.navigate([step]);
    this.toggle.emit();
  }
}
