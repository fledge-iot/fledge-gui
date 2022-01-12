import { Component, OnInit } from '@angular/core';
import { AlertService, ProgressBarService } from '../../../../services';
import { ControlDispatcherService } from '../../../../services/control-dispatcher.service';
import { range } from 'lodash';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-add-control-script',
  templateUrl: './add-control-script.component.html',
  styleUrls: ['./add-control-script.component.css']
})
export class AddControlScriptComponent implements OnInit {
  submitted = false;

  scriptPayload = {
    name: '',
    acl: ''
  }

  stepControlCount = 1; //default one step control visible
  stepControls = range(this.stepControlCount);

  stepData = [];
  acls = [];
  selectedACL;
  constructor(private controlService: ControlDispatcherService,
    private alertService: AlertService,
    private ngProgress: ProgressBarService) { }

  ngOnInit(): void {
    this.getAllACL();
  }

  onClick() {

  }

  public toggleDropdown() {
    const dropDown = document.querySelector('#acl-dropdown');
    console.log('dropdown', dropDown.classList);
    dropDown.classList.toggle('is-active');
  }


  getAllACL() {
    this.controlService.fetchAllACL()
      .subscribe((data: any) => {
        this.ngProgress.done();
        this.acls = data.acls;
        this.selectedACL = this.acls[0].name; // set first by default
        console.log(this.acls);
      }, error => {

        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      });
  }

  setStep(data) {
    this.stepData.push(data);
    console.log('control step data', data);
  }


  addStepControl() {
    this.stepControlCount += 1;
    this.stepControls = range(this.stepControlCount);
  }

  deleteStepControl() {
    this.stepControlCount -= 1;
    this.stepControls = range(this.stepControlCount);
  }

  selectACL(acl) {
    this.selectedACL = acl.name;
  }

  onSubmit(form: NgForm) {
    this.submitted = true;
    console.log('ngform', form);

  }

}
