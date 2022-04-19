import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AlertService, SharedService } from '../../../../services';
import { ControlDispatcherService } from '../../../../services/control-dispatcher.service';

@Component({
  selector: 'app-add-control-schedule-task',
  templateUrl: './add-control-schedule-task.component.html',
  styleUrls: ['./add-control-schedule-task.component.css']
})
export class AddControlScheduleTaskComponent implements OnInit {
  scripts = [];
  script = '';
  @ViewChild('controlScheduleTaskForm') controlScheduleTaskForm: NgForm;

  type: string;
  value: string;

  constructor(
    public sharedService: SharedService,
    public controlService: ControlDispatcherService,
    public alertService: AlertService) { }

  ngOnInit(): void {
    this.getScripts()
  }

  public toggleDropDown(id: string) {
    const dropdowns = document.getElementsByClassName('dropdown');
    for (let i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('is-active')) {
        openDropdown.classList.toggle('is-active', false);
      } else {
        if (openDropdown.id === id) {
          openDropdown.classList.toggle('is-active');
        }
      }
    }
  }

  public getScripts() {
    this.controlService.fetchControlServiceScripts()
      .subscribe((data: any) => {
        console.log('data', data);
        this.scripts = data.scripts;

      }, error => {
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      });
  }

  setScript(script: any) {
    this.script = script;
    console.log('script', script);
  }

  save() {
    console.log('controlScheduleTaskForm', this.controlScheduleTaskForm.value);
    const payload = {
      parameters: { [this.controlScheduleTaskForm.value.type]: this.controlScheduleTaskForm.value.value }
    }
    this.controlService.addControlScheduleTask(this.script, payload).subscribe((data) => {
      console.log('data', data);
    }, error => {
      if (error.status === 0) {
        console.log('service down ', error);
      } else {
        this.alertService.error(error.statusText);
      }
    });
  }

}
