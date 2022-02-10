import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SharedService } from '../../../../services';
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

  constructor(
    public sharedService: SharedService,
    private router: Router,
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
  }

  showDiv(id: string) {
    this.seletedTab = 'scripts';
    if (id === 'acls') {
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
