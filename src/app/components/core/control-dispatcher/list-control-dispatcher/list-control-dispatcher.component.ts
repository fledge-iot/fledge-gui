import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { SharedService } from '../../../../services';

@Component({
  selector: 'app-list-control-dispatcher',
  templateUrl: './list-control-dispatcher.component.html',
  styleUrls: ['./list-control-dispatcher.component.css']
})
export class ListControlDispatcherComponent implements OnInit {
  seletedTab: Number = 1;  // 1: control-script , 2 : control-acl
  isAdmin = false;
  private viewPortSubscription: Subscription;
  private subscription: Subscription;
  viewPort: any = '';

  constructor(private sharedService: SharedService) { }

  ngOnInit(): void {
    this.subscription = this.sharedService.isAdmin.subscribe(value => {
      this.isAdmin = value;
    });
    this.viewPortSubscription = this.sharedService.viewport
      .subscribe(viewport => {
        this.viewPort = viewport;
      });
  }

  showDiv(id: number) {
    this.seletedTab = 1;
    if (id === 2) {
      this.seletedTab = id;
    }
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
