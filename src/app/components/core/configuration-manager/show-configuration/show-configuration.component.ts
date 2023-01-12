import { Component, EventEmitter, Injectable, Input, OnInit, Output, SimpleChanges } from '@angular/core';
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
  editable: boolean;
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
  validity?: string;
  validityExpression?: string;

  constructor(options: {
    value?: T;
    key?: string;
    label?: string;
    description?: string,
    required?: boolean;
    readonly?: string;
    editable?: boolean,
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
    validity?: string;
    validityExpression?: string;
  } = {}) {
    this.value = options.value;
    this.key = options.key || '';
    this.label = options.label || '';
    this.description = options.description;
    this.required = !!options.required;
    this.readonly = options.readonly === undefined ? 'false' : options.readonly;
    this.editable = options.editable === undefined ? true : options.editable;
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
    this.validity = options.validity;
    this.validityExpression = '';
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
  private configuration: any;


  public set updatedConfiguration(config: any) {
    this.configuration = config;
  }


  public get updatedConfiguration(): any {
    return this.configuration;
  }

  /**
   * Create configuration form control based on configuration property type
   * @param configuration plugin configuration
   * @returns configuration formcontrols array
   */
  createConfigurationBase(configuration: any): ConfigurationBase<string>[] {
    const configurations: ConfigurationBase<string>[] = [];
    Object.keys(configuration).forEach(key => {
      const element = configuration[key];
      element.key = key;
      element.value = element.value ? element.value : element.default;
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
            order: element.order,
            validity: element.validity
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
            order: element.order,
            validity: element.validity
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
            order: element.order,
            validity: element.validity
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
            order: element.order,
            validity: element.validity
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
            editorOptions: this.setEditorConfig(key),
            validity: element.validity
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
            order: element.order,
            validity: element.validity
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
            editorOptions: this.setEditorConfig(key),
            validity: element.validity
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
            order: element.order,
            validity: element.validity
          }));
          break;
      }
    });
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

  /**
   *
   * @param pluginConfiguration plugin configuration
   * @param groupConfigurations  group item configuration
   * @returns
   */
  toFormGroup(pluginConfiguration: any, groupConfigurations: ConfigurationBase<string>[]) {
    const group: any = {};
    groupConfigurations.forEach(configuration => {
      group[configuration.key] = new FormControl({ value: configuration.value || '', disabled: this.validateConfigItem(pluginConfiguration, configuration) }, Validators.required);
    });
    return new FormGroup(group);
  }

  /**
   * validate form control on page init based on validation expression;
   *
   * @param pluginConfiguration complete configuration of a plugin
   * @param config single config item
   * @returns
   */
  validateConfigItem(pluginConfiguration: any, config: ConfigurationBase<string>) {
    if (config.validity) {
      config.validityExpression = config.validity;
      Object.keys(pluginConfiguration).forEach(key => {
        const el = pluginConfiguration[key];
        el.key = key;
        el.value = el.value ? el.value : el.default;
        // generate validation expression on page load based on configuration property values
        config.validityExpression = this.generateValidationExpression(el, config.validityExpression);
      });
      const isValidExpression = this.validateExpression(config.key, config.validityExpression);
      this.updatedConfiguration = pluginConfiguration;
      this.updatedConfiguration[config.key].validityExpression = config?.validityExpression;
      return !isValidExpression;
    }
  }

  checkConfigItemValidityOnChange(form: FormGroup, config: ConfigurationBase<string>) {
    // update config value in a global config object
    this.updatedConfiguration[config.key].value = config.value;
    // buid validation expression
    Object.keys(this.updatedConfiguration).forEach(key => {
      const cnf = this.updatedConfiguration[key];
      if (cnf.validity) {
        let expression = cnf.validity;
        Object.keys(this.updatedConfiguration).forEach(key => {
          const el = this.updatedConfiguration[key];
          // generate validation expression based on changed config item value
          expression = this.generateValidationExpression(el, expression);
        });
        // update validitionExpression property of the configuration item
        cnf.validityExpression = expression;
      }
    });

    // validate expression to enable/disable form control
    Object.keys(this.updatedConfiguration).forEach(key => {
      const cnf = this.updatedConfiguration[key];
      if (cnf.validity) {
        const isValidExpression = this.validateExpression(key, cnf.validityExpression);
        isValidExpression ? form.controls[cnf.key]?.enable({ emitEvent: false }) : form.controls[cnf.key]?.disable({ emitEvent: false });
      }
    });
  }

  /**
   * Validate form control on cofiguration tab switch
   * @param form : FormGroup
   */
  checkConfigItemOnGroupChange(form: FormGroup) {
    Object.keys(this.updatedConfiguration).forEach(key => {
      const cnf = this.updatedConfiguration[key];
      if (cnf.hasOwnProperty('validityExpression')) {
        const isValidExpression = this.validateExpression(key, cnf.validityExpression);
        isValidExpression ? form.controls[cnf.key]?.enable({ emitEvent: false }) : form.controls[cnf.key]?.disable({ emitEvent: false });
      }
    });
  }

  /**
   * Generate validation expression based on config property values
   * @param config configuration item
   * @param expression validation expression
   * @returns
   */
  generateValidationExpression(config: any, expression: string) {
    const regex = new RegExp(`${config.key}[^"]?\\s?.=`);
    // check if validity expression has the config key
    if (regex.test(expression)) {
      expression = expression
        .split(new RegExp(`${config.key.trim()}+(?=.*=)`)).join(`"${config.value}"`);
    }
    return expression;
  }

  /**
   * evaluate validation expresison to enable/disable form control
   * @param key config property
   * @param expression validation expression
   * @returns
   */
  validateExpression(key: string, expression: string) {
    try {
      const e = eval(expression);
      if (typeof (e) !== 'boolean') {
        console.log('Validity expression', expression, 'for', key, 'evlauted to non-boolean value ', e);
      }
      return e === false ? false : true;
    } catch (e) {
      console.log(e);
      return true;
    }
  }
}


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
