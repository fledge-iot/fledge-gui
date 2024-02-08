import { Component, OnInit, Output, EventEmitter, Input, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { ProgressBarService, SchedulesService, ServicesApiService, SharedService, RolesService } from '../../../../services';
import { ControlDispatcherService } from '../../../../services/control-dispatcher.service';
import { DocService } from '../../../../services/doc.service';

@Component({
  selector: 'app-add-dispatcher-service',
  templateUrl: './add-dispatcher-service.component.html',
  styleUrls: ['./add-dispatcher-service.component.css']
})
export class AddDispatcherServiceComponent implements OnInit {
  private viewPortSubscription: Subscription;
  private subscription: Subscription;
  dispatcherServiceInstalled;
  dispatcherServiceAdded;
  dispatcherServiceEnabled;
  dispatcherServiceName: string = '';
  showConfigureModal: boolean = false;

  @Output() serviceStatusEvent = new EventEmitter<boolean>();
  @Output() serviceConfigureModal = new EventEmitter<Object>();
  
  constructor(
    public controlService: ControlDispatcherService,
    public sharedService: SharedService,
    public schedulesService: SchedulesService,
    public servicesApiService: ServicesApiService,
    public ngProgress: ProgressBarService,
    public docService: DocService,
    public rolesService: RolesService
  ) { }

  ngOnInit(): void {
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
          this.serviceStatusEvent.emit(this.dispatcherServiceInstalled && this.dispatcherServiceAdded);
          this.emitData();
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
          this.dispatcherServiceName = '';
          if (schedule) {
            this.dispatcherServiceAdded = true;
            this.dispatcherServiceName = schedule.name;
          }
          if (schedule?.enabled) {
            this.dispatcherServiceEnabled = true;
          }
          this.serviceStatusEvent.emit(this.dispatcherServiceInstalled && this.dispatcherServiceAdded);
          this.emitData();
        },
        error => {
          /** request done */
          this.ngProgress.done();
          console.log('service down ', error);
        });
  }

  /**
   * refresh even trigger
   * @param tab selected control name
   */
  refresh(tab: string) {
    this.controlService.triggerRefreshEvent.next(tab);
  }

  /**
   * Open Configure Service modal
   */
  openConfigureModal() {
    this.emitData(true);
  }

  emitData(isOpenModal = false) {
    const serviceInfo = {
      name: this.dispatcherServiceName,
      isEnabled: this.dispatcherServiceEnabled,
      added: this.dispatcherServiceAdded,
      process: 'dispatcher',
      type: 'Dispatcher',
      package: 'fledge-service-dispatcher',
      isInstalled: this.dispatcherServiceInstalled,
      isOpen: isOpenModal
    }
    this.serviceConfigureModal.emit(serviceInfo);
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
