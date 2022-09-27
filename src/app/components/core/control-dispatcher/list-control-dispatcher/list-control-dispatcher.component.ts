import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProgressBarService, SchedulesService, ServicesApiService, SharedService } from '../../../../services';
import { ControlDispatcherService } from '../../../../services/control-dispatcher.service';
import { DocService } from '../../../../services/doc.service';

@Component({
  selector: 'app-list-control-dispatcher',
  templateUrl: './list-control-dispatcher.component.html',
  styleUrls: ['./list-control-dispatcher.component.css']
})
export class ListControlDispatcherComponent implements OnInit {
  seletedTab = 'scripts';
  private viewPortSubscription: Subscription;
  private subscription: Subscription;
  viewPort: any = '';
  dispatcherServiceInstalled;
  dispatcherServiceAdded;
  dispatcherServiceEnabled;
  constructor(
    public controlService: ControlDispatcherService,
    public sharedService: SharedService,
    public schedulesService: SchedulesService,
    public servicesApiService: ServicesApiService,
    private router: Router,
    public ngProgress: ProgressBarService,
    public docService: DocService,
    private route: ActivatedRoute) {
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.seletedTab = params['tab'];
      }
    });
  }

  ngOnInit(): void {
    this.viewPortSubscription = this.sharedService.viewport
      .subscribe(viewport => {
        this.viewPort = viewport;
      });
    this.getInstalledServicesList();
  }

  public getInstalledServicesList() {
    /** request start */
    this.ngProgress.start();
    this.servicesApiService.getInstalledServices().
      then((data: any) => {
        /** request done */
        this.ngProgress.done();
        // Check if dispatcher service available in installed services list
        this.dispatcherServiceInstalled = data.services.includes('dispatcher');
        if (this.dispatcherServiceInstalled) {
          this.getSchedules();
        } else {
          this.dispatcherServiceInstalled = false;
          this.dispatcherServiceAdded = false;
          this.dispatcherServiceEnabled = false;
        }
      })
      .catch(error => {
        /** request done */
        this.ngProgress.done();
        console.log('service down ', error);
      });
  }

  public getSchedules(): void {
    /** request start */
    this.ngProgress.start();
    this.schedulesService.getSchedules().
      subscribe(
        (data: any) => {
          /** request done */
          this.ngProgress.done();
          const schedule = data.schedules.find((item: any) => item.processName === 'dispatcher_c');
          this.dispatcherServiceEnabled = false;
          this.dispatcherServiceAdded = false;
          if (schedule) {
            this.dispatcherServiceAdded = true;
          }
          if (schedule?.enabled) {
            this.dispatcherServiceEnabled = true;
          }
        },
        error => {
          /** request done */
          this.ngProgress.done();
          console.log('service down ', error);
        });
  }

  showDiv(id: string) {
    this.seletedTab = 'scripts';
    if (id === 'acls') {
      this.seletedTab = id;
    } else if (id === 'tasks') {
      this.seletedTab = id;
    }
    // update query param on tab selection in url
    const queryParams: Params = { tab: this.seletedTab };
    this.router.navigate(
      [],
      {
        relativeTo: this.route,
        queryParams: queryParams,
        queryParamsHandling: 'merge'
      });
  }

  /**
   * refresh even trigger
   * @param tab selected control name
   */
  refresh(tab: string) {
    this.controlService.triggerRefreshEvent.next(tab);
  }

  navigate() {
    if (this.seletedTab === 'scripts') {
      this.router.navigate(['script/add'], { relativeTo: this.route });
    } else if (this.seletedTab == 'acls') {
      this.router.navigate(['acl/add'], { relativeTo: this.route });
    } else {
      this.router.navigate(['task/add'], { relativeTo: this.route });
    }
  }

  goToLink(urlSlug: string) {
    this.docService.goToSetPointControlDocLink(urlSlug);
  }

  public ngOnDestroy(): void {
    if (this.viewPortSubscription) {
      this.viewPortSubscription.unsubscribe();
    }

    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
