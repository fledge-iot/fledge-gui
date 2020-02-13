import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { environment } from '../../../../environments/environment';
import * as data from '../../../../git-version.json';

@Component({
  selector: 'app-footer',
  templateUrl: 'footer.component.html',
  styleUrls: ['./footer.component.css']
})

export class FooterComponent {
  public appVersion: string = environment.VERSION;
  public git = data['default'];

  constructor(public router: Router) {}
}
