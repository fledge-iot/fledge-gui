import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AlertService, ProgressBarService, RolesService } from '../../../../../services';
import { PackageManagerService } from '../../../../../services/package-manager.service';
import { SharedService } from '../../../../../services/shared.service';
import { sortBy } from 'lodash';

@Component({
  selector: 'app-list-python-packages',
  templateUrl: './list-python-packages.component.html',
  styleUrls: ['./list-python-packages.component.css']
})
export class ListPythonPackagesComponent implements OnInit {
  public showSpinner = false;
  private viewPortSubscription: Subscription;
  viewPort: any = '';
  pythonPackages = [];

  constructor(
    public sharedService: SharedService,
    private alertService: AlertService,
    public ngProgress: ProgressBarService,
    public packageManagerService: PackageManagerService,
    public rolesService: RolesService) { }

  ngOnInit(): void {
    this.viewPortSubscription = this.sharedService.viewport
      .subscribe(viewport => {
        this.viewPort = viewport;
      });
    this.getPythonPackages();
  }

  getPythonPackages() {
    /** request started */
    this.ngProgress.start();
    this.packageManagerService.getPythonPackages()
      .subscribe(
        (data: any) => {
          /** request completed */
          this.ngProgress.done();
          this.pythonPackages = sortBy(data.packages, p => p.package.toLowerCase());
        },
        error => {
          /** request completed */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public ngOnDestroy(): void {
    this.viewPortSubscription.unsubscribe();
  }

}
