import { Component, OnInit, ViewChild } from '@angular/core';
import { ServicesHealthService } from '../../../services';
import { AlertService } from '../../../services/alert.service';
import { Router } from '@angular/router';
import { SouthServiceModalComponent } from './south-service-modal/south-service-modal/south-service-modal.component';
@Component({
  selector: 'app-south',
  templateUrl: './south.component.html',
  styleUrls: ['./south.component.css']
})
export class SouthComponent implements OnInit {
  public services = [];
  public service: string;

  @ViewChild(SouthServiceModalComponent) southServiceModal: SouthServiceModalComponent;

  constructor(private servicesHealthService: ServicesHealthService,
    private alertService: AlertService,
    private router: Router) { }

  ngOnInit() {
    this.getServiceData();
  }


  public getServiceData() {
    this.servicesHealthService.getAllServices()
      .subscribe(
        (data) => {
          if (data['error']) {
            console.log('error in response', data['error']);
            this.alertService.warning('Could not connect to API');
            return;
          }
          this.services = data['services'];
          this.services = this.services.filter((item) => item.type === 'Southbound');
        },
        (error) => {
          this.alertService.warning('Could not connect to API');
          console.log('error: ', error);
        });
  }

  addSouthService() {
    this.router.navigate(['/south/add']);
  }

  /**
 * Open create scheduler modal dialog
 */
  openSouthServiceModal(service) {
    this.service = service;
    // call child component method to toggle modal
    this.southServiceModal.toggleModal(true);
  }
}
