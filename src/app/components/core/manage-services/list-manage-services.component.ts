import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AlertService, ProgressBarService, RolesService } from '../../../services';
import { SharedService } from '../../../services/shared.service';

@Component({
  selector: 'app-manage-services',
  templateUrl: './list-manage-services.component.html',
  styleUrls: ['./list-manage-services.component.css']
})
export class ListManageServicesComponent implements OnInit {
  private viewPortSubscription: Subscription;
  viewPort: any = '';

  constructor(
    public sharedService: SharedService,
    private alertService: AlertService,
    public ngProgress: ProgressBarService,
    public rolesService: RolesService) { }

  ngOnInit(): void {
    this.viewPortSubscription = this.sharedService.viewport
      .subscribe(viewport => {
        this.viewPort = viewport;
      });
    this.getAllServices();
  }

  getAllServices() {
    console.log('getAllServices');
  }

  public ngOnDestroy(): void {
    this.viewPortSubscription.unsubscribe();
  }

}
