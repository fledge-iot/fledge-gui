import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as data from '../../../../git-version.json';
import * as moment from 'moment';

@Component({
  selector: 'app-footer',
  templateUrl: 'footer.component.html',
  styleUrls: ['./footer.component.css']
})

export class FooterComponent implements OnInit {
  public appVersion;
  public git = data['default'];
  copyrightYear = moment().year();

  constructor(public router: Router) { }

  ngOnInit(): void {
    if (this.git?.distance == 0) {
      // released version
      this.appVersion = `v${this.git.semverString.replace('+0', '')}`
    } else {
      this.appVersion = `v${this.git.semverString.replace(`+${this.git?.distance}.`, `-${this.git?.distance}-`)}`;
    }
  }
}
