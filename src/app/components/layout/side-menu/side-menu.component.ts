import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { DocService } from '../../../services/doc.service';
import { SharedService } from '../../../services/shared.service';

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.css']
})
export class SideMenuComponent implements OnInit {
  public step = '';
  @Output() toggle: EventEmitter<any> = new EventEmitter();

  isAdmin = false;
  constructor(
    private router: Router,
    private docService: DocService,
    private sharedService: SharedService
  ) { }
  ngOnInit() {
    this.sharedService.isAdmin.subscribe(value => {
      this.isAdmin = value;
    });
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

  goToLink() {
    this.docService.goToLink();
  }
}
