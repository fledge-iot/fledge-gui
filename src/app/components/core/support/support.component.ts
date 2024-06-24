import { Component, OnInit, OnDestroy } from '@angular/core';
import { AlertService, SupportService, ProgressBarService, SharedService, RolesService } from '../../../services';
import { Subscription } from 'rxjs';
import { DocService } from '../../../services/doc.service';

@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.css']
})
export class SupportComponent implements OnInit, OnDestroy {
  public bundlesData = [];
  private viewPortSubscription: Subscription;
  viewPort: any = '';

  constructor(private supportBundleService: SupportService,
    public ngProgress: ProgressBarService,
    private alertService: AlertService,
    private docService: DocService,
    private sharedService: SharedService,
    public rolesService: RolesService) { }

  ngOnInit() {
    this.getBundles();
    this.viewPortSubscription = this.sharedService.viewport.subscribe(viewport => {
      this.viewPort = viewport;
    });
  }

  public getBundles() {
    this.ngProgress.start();
    this.supportBundleService.get().
      subscribe(
        (data) => {
          this.ngProgress.done();
          this.bundlesData = data['bundles'].sort().reverse();
        },
        error => {
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public requestNewBundle() {
    this.ngProgress.start();
    this.supportBundleService.post().
      subscribe(
        () => {
          this.ngProgress.done();
          this.alertService.success('Support bundle created successfully');
          this.getBundles();
        },
        error => {
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public async downloadBundle(bundle): Promise<void> {
    try {
      const blob = await this.supportBundleService.downloadSupportBundle(bundle);
      const url = window.URL.createObjectURL(blob);
      // create a custom anchor tag
      const a = document.createElement('a');
      a.href = url;
      a.download = bundle;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      if (error.status === 0) {
        console.log('service down ', error);
      } else {
        this.alertService.error(error.statusText);
      }
    }
  }

  goToLink() {
    const urlSlug = 'support.html'
    this.docService.goToViewQuickStartLink(urlSlug);
  }

  public ngOnDestroy(): void {
    this.viewPortSubscription.unsubscribe();
  }
}

