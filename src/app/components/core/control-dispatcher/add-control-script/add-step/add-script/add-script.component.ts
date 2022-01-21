import { Component, Input, OnInit, SimpleChange } from '@angular/core';
import { ControlContainer, FormControl, FormGroup, NgForm } from '@angular/forms';
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
  selectedScript = ''; // selected list in the dropdown
  execution = [{ name: 'blocking', value: '' }, { name: 'non blocking', value: 'background' }];
  selectedExecution = '';
  @Input() controlIndex; // position of the control in the dom
  @Input() step; // type of step
  @Input() config;
  @Input() update = false;

  stepsGroup: FormGroup;
  values = [];
  script = ''; // script name for filtering self script use in script type step

  constructor(
    private route: ActivatedRoute,
    private alertService: AlertService,
    private controlService: ControlDispatcherService,
    public sharedService: SharedService,
    private control: NgForm) { }

  ngOnChanges(simpleChange: SimpleChange) {
    if (!simpleChange['config']?.firstChange && this.config) {
      this.config = simpleChange['config'].currentValue;
      this.setScript(this.config.value.name);
      this.setExecution(this.config.value.execution === 'background' ? this.execution[1] : this.execution[0]);
    }
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.script = params['name'];
    });
    this.getScripts();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.stepsGroup = this.control.controls[`step-${this.controlIndex}`] as FormGroup;
      this.stepsGroup.addControl('script', new FormGroup({
        name: new FormControl(''),
        execution: new FormControl(''),
        parameters: new FormGroup({}),
        condition: new FormGroup({}),
      }));

      if (this.config && this.config.key === this.step) {
        this.setScript(this.config.value.name);
        this.setExecution(this.config.value.execution === 'background' ? this.execution[1] : this.execution[0]);
      }
    }, 0);
  }

  scriptControlGroup(): FormGroup {
    return this.stepsGroup.controls['script'] as FormGroup;
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
    this.selectedScript = script;
    this.scriptControlGroup().controls['name'].setValue(script)
  }

  setExecution(item: any) {
    this.selectedExecution = item.name;
    this.scriptControlGroup().controls['execution'].setValue(item.value)
  }

}
