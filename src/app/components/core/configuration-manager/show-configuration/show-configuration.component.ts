import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { filter, map, pairwise, startWith } from 'rxjs/operators';
import { RolesService, ConfigurationControlService, ConfigurationBase } from '../../../../services';

@Component({
  selector: 'app-show-configuration',
  templateUrl: './show-configuration.component.html',
  styleUrls: ['./show-configuration.component.css']
})
export class ShowConfigurationComponent implements OnInit {
  @Input() fullConfiguration: any;
  @Input() groupConfiguration: ConfigurationBase<string>[] | null = [];
  @Input() group: string = '';
  @Input() selectedGroup = '';

  @Output() event = new EventEmitter<any>();
  configurations$: Observable<ConfigurationBase<any>[]>;
  form: FormGroup;

  constructor(private fb: FormBuilder,
    public rolesService: RolesService,
    private configControlService: ConfigurationControlService) {
    this.form = this.fb.group({
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!changes?.selectedGroup?.firstChange) {
      if (changes?.selectedGroup?.currentValue == this.group) {
        this.configControlService.checkConfigItemOnGroupChange(this.form);
        return;
      }
    }
  }

  ngOnInit(): void {
    this.groupConfiguration = this.configControlService.createConfigurationBase(this.groupConfiguration);
    this.configurations$ = of(this.groupConfiguration);
    this.form = this.configControlService.toFormGroup(this.fullConfiguration, this.groupConfiguration as ConfigurationBase<string>[]);
    this.configControlService.updatedConfiguration = this.fullConfiguration;

    this.form.valueChanges.pipe(
      startWith(this.form.value),
      pairwise(),
      map(([oldState, newState]) => {
        let changes = {};
        for (const key in newState) {
          if (oldState[key] !== newState[key]) {
            changes[key] = newState[key];
          }
        }
        return changes;
      }),
      filter(changes => Object.keys(changes).length !== 0 && !this.form.invalid)
    ).subscribe(
      data => {
        const [key, value] = Object.entries(data)[0];
        const configuration = this.groupConfiguration.find(c => c.key === key);
        if (configuration) {
          configuration.value = value.toString();
          this.configControlService.checkConfigItemValidityOnChange(this.form, configuration);
        }
        this.event.emit(data);
      });
  }

  setCheckboxState(key: string, evt: any) {
    this.form.controls[key].patchValue(`${evt.target.checked}`);
  }

  public fileChange(event, config: ConfigurationBase<string>) {
    const fileReader = new FileReader();
    const fi = event.target;
    if (fi.files.length !== 0) {
      config.validFileExtension = true;
    }
    if (fi.files && fi.files[0]) {
      const file = fi.files[0];
      fileReader.onload = () => {
        config.value = fileReader.result.toString();
        this.form.controls[config.key].patchValue(config.value);
        // this.fileContent = fileReader.result.toString();
      };
      fileReader.readAsText(file);
      const ext = file.name.substring(file.name.lastIndexOf('.') + 1);
      if (ext !== 'py') {
        config.validFileExtension = false;
      } else {
        config.files.push({ [config.key]: file });
      }
    }
  }

  togglePassword(input: any): any {
    input.type = input.type === 'password' ? 'text' : 'password';
  }
}
