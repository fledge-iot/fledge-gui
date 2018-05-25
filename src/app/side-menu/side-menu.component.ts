import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.css']
})
export class SideMenuComponent implements OnInit {
  public step: string = '';
  @Output() toggle: EventEmitter<any> = new EventEmitter();

  isAdmin = false;
  isSkip = false;
  constructor(private router: Router, private activatedRoute: ActivatedRoute) { }

  ngOnInit() {
    this.isAdmin = JSON.parse(sessionStorage.getItem('isAdmin'));
    this.isSkip = JSON.parse(sessionStorage.getItem('skip'));
    this.router.events.subscribe((res) => {
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
