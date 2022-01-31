import { Component, Input, OnInit } from '@angular/core';
import { ControlContainer, FormGroup, NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { orderBy } from 'lodash';
import { AlertService, SharedService } from '../../../../../../services';
import { ControlDispatcherService } from '../../../../../../services/control-dispatcher.service';

@Component({
  selector: 'app-add-script',
  templateUrl: './add-script.component.html',
  styleUrls: ['./add-script.component.css'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class AddScriptComponent implements OnInit {
  scripts = [];  // list of south services
  execution = [{ name: 'blocking', value: '' }, { name: 'non blocking', value: 'background' }];
  selectedExecution = '';
  config;

  @Input() controlIndex; // position of the control in the dom
  @Input() step; // type of step
  @Input() update = false;

  script = ''; // script name for filtering self script use in script type step

  constructor(
    private route: ActivatedRoute,
    private alertService: AlertService,
    private controlService: ControlDispatcherService,
    public sharedService: SharedService,
    private control: NgForm) { }

  ngOnChanges() {
    this.config = this.control.value['steps'][`step-${this.controlIndex}`]['script'];
    if (this.config) {
      this.setOrder();
    }
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.script = params['name'];
    });
    this.getScripts();
  }

  public getScripts() {
    this.controlService.fetchControlServiceScripts()
      .subscribe((data: any) => {
        this.scripts = data.scripts.filter(s => s.name !== this.script);
        this.scripts = orderBy(this.scripts, 'name')

      }, error => {
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      });
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

  setScript(script: any) {
    this.config.name = script;
    this.scriptControlGroup().controls['name'].setValue(script);
    this.scriptControlGroup().markAsTouched();
    this.scriptControlGroup().markAsDirty();
  }

  setExecution(item: any) {
    this.config.execution = item.value;
    this.scriptControlGroup().controls['execution'].setValue(item.value);
    this.scriptControlGroup().markAsTouched();
    this.scriptControlGroup().markAsDirty();
  }

  stepsFormGroup() {
    return this.control.form.controls['steps'] as FormGroup;
  }

  stepControlGroup(): FormGroup {
    return this.stepsFormGroup().controls[`step-${this.controlIndex}`] as FormGroup;
  }

  scriptControlGroup() {
    return this.stepControlGroup().controls['script'] as FormGroup;
  }

  setOrder() {
    this.scriptControlGroup().controls['order'].patchValue(this.controlIndex);
  }

}
