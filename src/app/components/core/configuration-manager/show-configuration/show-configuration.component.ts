import { Component, EventEmitter, Injectable, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { filter, map, pairwise, startWith } from 'rxjs/operators';
import { RolesService } from '../../../../services';

export class ConfigurationBase<T> {
  value: T | undefined;
  key: string;
  label: string;
  description: string;
  required: boolean;
  readonly: string;
  editable: string;
  mandatory: string;
  maximum: string;
  minimum: string;
  order: number;
  controlType: string;
  type: string;
  options: { key: string, value: string }[];
  editorOptions: {};
  file: string;
  files: {}[];
  validFileExtension?: boolean;

  constructor(options: {
    value?: T;
    key?: string;
    label?: string;
    description?: string,
    required?: boolean;
    readonly?: string;
    editable?: string,
    mandatory?: string,
    maximum?: string,
    minimum?: string;
    order?: number;
    controlType?: string;
    type?: string;
    options?: { key: string, value: string }[];
    editorOptions?: {};
    file?: string;
    files?: {}[];
    validFileExtension?: boolean;
  } = {}) {
    this.value = options.value;
    this.key = options.key || '';
    this.label = options.label || '';
    this.description = options.description;
    this.required = !!options.required;
    this.readonly = options.readonly === undefined ? 'false' : options.readonly;
    this.editable = options.editable === undefined ? 'true' : options.editable;
    this.mandatory = options.mandatory === undefined ? 'false' : options.mandatory;
    this.order = options.order === undefined ? 1 : options.order;
    this.minimum = options.minimum;
    this.maximum = options.maximum;
    this.controlType = options.controlType || '';
    this.type = options.type || '';
    this.options = options.options || [];
    this.editorOptions = options.editorOptions || {};
    this.file = options.file || '';
    this.files = options.files || [];
    this.validFileExtension = options.validFileExtension || true;
  }
}



export class TextboxConfig extends ConfigurationBase<string> {
  override controlType = 'TEXT';
}

export class DropdownConfig extends ConfigurationBase<string> {
  override controlType = 'DROPDOWN';
}

export class CheckboxConfig extends ConfigurationBase<string> {
  override controlType = 'CHECKBOX';
}

export class IntegerConfig extends ConfigurationBase<string> {
  override controlType = 'INTEGER';
}

export class FloatConfig extends ConfigurationBase<string> {
  override controlType = 'FLOAT';
}

export class JSONConfig extends ConfigurationBase<string> {
  override controlType = 'JSON';
}

export class ScriptConfig extends ConfigurationBase<string> {
  override controlType = 'SCRIPT';
  override file = '';
  override validFileExtension = true;
}

export class PasswordConfig extends ConfigurationBase<string> {
  override controlType = 'PASSWORD';
}

export class URLConfig extends ConfigurationBase<string> {
  override controlType = 'URL';
}

export class ACLConfig extends ConfigurationBase<string> {
  override controlType = 'ACL';
}

@Injectable({
  providedIn: 'root'
})
export class ConfigurationControlService {
  createConfigurationBase(configuration: any): ConfigurationBase<string>[] {
    // console.log('config', configuration);
    const configurations: ConfigurationBase<string>[] = [];
    Object.keys(configuration).forEach(key => {
      const element = configuration[key];
      element.key = key;
      element.value = element.value ? element.value : element.default;
      console.log('el', element);

      switch (element.type.toUpperCase()) {
        case 'INTEGER':
          configurations.push(new IntegerConfig({
            key: key,
            type: 'number',
            label: this.setDisplayName(element),
            description: element.description,
            value: element.value,
            minimum: element.minimum,
            maximum: element.maximum,
            readonly: element.readonly,
            order: element.order
          }));
          break;
        case 'FLOAT':
          configurations.push(new FloatConfig({
            key: key,
            type: 'number',
            label: this.setDisplayName(element),
            description: element.description,
            value: element.value,
            minimum: element.minimum,
            maximum: element.maximum,
            readonly: element.readonly,
            order: element.order
          }));
          break;
        case 'BOOLEAN':
          configurations.push(new CheckboxConfig({
            key: key,
            type: 'checkbox',
            label: this.setDisplayName(element),
            description: element.description,
            value: element.value,
            readonly: element.readonly,
            order: element.order
          }));
          break;
        case 'ENUMERATION':
          configurations.push(new DropdownConfig({
            key: key,
            type: 'dropdown',
            label: this.setDisplayName(element),
            description: element.description,
            value: element.value,
            readonly: element.readonly,
            options: element.options,
            order: element.order
          }));
          break;
        case 'JSON':
        case 'X509 CERTIFICATE':
          configurations.push(new JSONConfig({
            key: key,
            type: 'json',
            label: this.setDisplayName(element),
            description: element.description,
            value: element.value,
            readonly: element.readonly,
            options: element.options,
            order: element.order,
            editorOptions: this.setEditorConfig(key)
          }));
          break;
        case 'ACL':

          break;

        case 'URL':

          break;
        case 'PASSWORD':
          configurations.push(new PasswordConfig({
            key: key,
            type: 'password',
            label: this.setDisplayName(element),
            description: element.description,
            value: element.value,
            readonly: element.readonly,
            options: element.options,
            order: element.order
          }));
          break;
        case 'SCRIPT':
          configurations.push(new ScriptConfig({
            key: key,
            type: 'script',
            label: this.setDisplayName(element),
            description: element.description,
            value: element.value,
            readonly: element.readonly,
            options: element.options,
            order: element.order,
            file: element.file,
            editorOptions: this.setEditorConfig(key)
          }));
          break;
        case 'IPV4':
        case 'IPV6':
        default:
          configurations.push(new TextboxConfig({
            key: key,
            type: 'text',
            label: this.setDisplayName(element),
            description: element.description,
            value: element.value,
            readonly: element.readonly,
            order: element.order
          }));
          break;
      }
    });


    console.log('c', configurations);

    return configurations.sort((a, b) => a.order - b.order);
  }

  public setEditorConfig(type: string) {
    const editorOptions = {
      mode: 'text/x-python',
      lineNumbers: true,
      lineWrapping: true,
      foldGutter: true,
      gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter', 'CodeMirror-lint-markers'],
      autoCloseBrackets: true,
      matchBrackets: true,
      lint: true,
      inputStyle: 'textarea'
    };
    if (type === 'JSON') {
      editorOptions.mode = 'application/json';
    }
    return editorOptions;
  }

  public setDisplayName(configItem: any) {
    if (configItem.hasOwnProperty('displayName')) {
      return configItem.displayName.trim().length > 0 ? configItem.displayName : configItem.key;
    }
    return configItem.key;
  }

  toFormGroup(configuration: ConfigurationBase<string>[]) {
    const group: any = {};
    configuration.forEach(configuration => {
      group[configuration.key] = configuration.required ? new FormControl(configuration.value || '', Validators.required)
        : new FormControl(configuration.value || '');
    });
    return new FormGroup(group);
  }
}




@Component({
  selector: 'app-show-configuration',
  templateUrl: './show-configuration.component.html',
  styleUrls: ['./show-configuration.component.css']
})
export class ShowConfigurationComponent implements OnInit {
  @Input() configuration: ConfigurationBase<string>[] | null = [];
  @Output() event = new EventEmitter<any>();
  form: FormGroup;
  configurations$: Observable<ConfigurationBase<any>[]>;
  // get isValid() { return this.form.controls[this.configuration.key].valid; }

  constructor(private fb: FormBuilder,
    public rolesService: RolesService,
    private configControlService: ConfigurationControlService) {
    this.form = this.fb.group({
    });
  }

  ngOnInit(): void {
    this.configuration = this.configControlService.createConfigurationBase(this.configuration);
    this.configurations$ = of(this.configuration);
    this.form = this.configControlService.toFormGroup(this.configuration as ConfigurationBase<string>[]);

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
        console.log('d', data);
        this.event.emit(data);
      });
  }

  setCheckboxState(key: string, evt: any) {
    this.form.controls[key].patchValue(`${evt.target.checked}`);
  }

  public fileChange(event, config: ConfigurationBase<string>) {
    console.log('event', event);
    console.log('config', config);
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
