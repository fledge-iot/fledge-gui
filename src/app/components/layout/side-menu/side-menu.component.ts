import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { name, version } from '../../../../../package.json';
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
  constructor(private router: Router, private sharedService: SharedService) { }
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
    const v = version.includes('next') ? 'develop' : `v${version}`;
    if (name === 'fledge') {
      window.open(`https://fledge-iot.readthedocs.io/en/${v}`, '_blank');
    } else {
      window.open(`https://foglamp-foglamp-documentation.readthedocs-hosted.com/en/${v}`, '_blank');
    }
  }
}
