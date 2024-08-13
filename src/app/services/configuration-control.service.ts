import { Injectable } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { AclService } from './acl.service';
import { orderBy, map, cloneDeep, reduce, assign } from 'lodash';

export class ConfigurationBase<T> {
  value: T | undefined;
  key: string;
  label: string;
  description: string;
  required: boolean;
  readonly: string;
  editable: boolean;
  mandatory: string;
  permissions?: string[];
  maximum: string;
  minimum: string;
  order: number;
  length: string; // hold password max length
  controlType: string;
  type: string;
  options: { key: string, value: string }[];
  editorOptions: {};
  fileName: string;
  file: File;
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
    options?: [];
    permissions?: string[];
    length?: string;
    editorOptions?: {};
    file?: string;
    files?: File;
    validFileExtension?: boolean;
    validity?: string;
    validityExpression?: string;
  } = {}) {
    this.value = options.value;
    this.key = options.key || '';
    this.label = options.label || '';
    this.description = options.description;
    this.readonly = options.readonly ?? 'false';
    this.mandatory = options.mandatory ?? 'false';
    this.permissions = options.permissions;
    this.required = options.mandatory === undefined ? false : (options.mandatory == 'true');
    this.editable = options.editable ?? true;
    // assign a big number to the property which doesn't have 'order' key to show the property at last
    this.order = options.order ?? 999;
    this.length = options.length;
    this.minimum = options.minimum;
    this.maximum = options.maximum;
    this.controlType = options.controlType || '';
    this.type = options.type || '';
    this.options = options.options || [];
    this.editorOptions = options.editorOptions || {};
    this.fileName = options.file || '';
    this.file = options.files;
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

export class BucketConfig extends ConfigurationBase<string> {
  override controlType = 'BUCKET';
}

export class ScriptConfig extends ConfigurationBase<string> {
  override controlType = 'SCRIPT';
  override validFileExtension = true;
}

export class CodeConfig extends ConfigurationBase<string> {
  override controlType = 'CODE';
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

export class ListConfig extends ConfigurationBase<string> {
  override controlType = 'LIST';
  public listSize = '';
  public items: '';
  public properties: '';
}

export class KVListConfig extends ConfigurationBase<string> {
  override controlType = 'KVLIST';
  public listSize = '';
  public items: '';
  public properties: '';
}



@Injectable({
  providedIn: 'root'
})
export class ConfigurationControlService {
  private allACLs = [];

  public set acls(acls: []) {
    this.allACLs = acls;
  }

  public get acls(): any {
    return this.allACLs;
  }

  constructor(private aclService: AclService) { }

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
      element.value = element.value !== undefined ? element.value : element.default;
      if (element.type.toLowerCase() == 'acl') {
        // fetch all acls if property type is 'acl'
        this.getAllACLs();
      }
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
            mandatory: element.mandatory,
            permissions: element.permissions,
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
            mandatory: element.mandatory,
            permissions: element.permissions,
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
            mandatory: element.mandatory,
            permissions: element.permissions,
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
            mandatory: element.mandatory,
            permissions: element.permissions,
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
            value: JSON.stringify(JSON.parse(element.value), null, ' '),
            readonly: element.readonly,
            mandatory: element.mandatory,
            permissions: element.permissions,
            order: element.order,
            editorOptions: this.setEditorConfig(element.type),
            validity: element.validity
          }));
          break;
        case 'BUCKET':
          configurations.push(new BucketConfig({
            key: key,
            type: 'bucket',
            label: this.setDisplayName(element),
            description: element.description,
            value: element.value,
            readonly: element.readonly,
            mandatory: element.mandatory,
            permissions: element.permissions,
            order: element.order,
            editorOptions: this.setEditorConfig(element.type),
            validity: element.validity
          }));
          break;
        case 'ACL':
          configurations.push(new ACLConfig({
            key: key,
            type: 'dropdown',
            label: this.setDisplayName(element),
            description: element.description,
            value: element.value,
            readonly: element.readonly,
            mandatory: element.mandatory,
            permissions: element.permissions,
            order: element.order,
            validity: element.validity,
          }));
          break;
        case 'URL':
          configurations.push(new URLConfig({
            key: key,
            type: 'url',
            label: this.setDisplayName(element),
            description: element.description,
            value: element.value,
            readonly: element.readonly,
            mandatory: element.mandatory,
            permissions: element.permissions,
            order: element.order,
            validity: element.validity
          }));
          break;
        case 'PASSWORD':
          configurations.push(new PasswordConfig({
            key: key,
            type: 'password',
            label: this.setDisplayName(element),
            description: element.description,
            value: element.value,
            readonly: element.readonly,
            mandatory: element.mandatory,
            permissions: element.permissions,
            length: element.length,
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
            mandatory: element.mandatory,
            permissions: element.permissions,
            order: element.order,
            file: element.file,
            editorOptions: this.setEditorConfig(element.type),
            validity: element.validity
          }));
          break;
        case 'CODE':
          configurations.push(new CodeConfig({
            key: key,
            type: 'code',
            label: this.setDisplayName(element),
            description: element.description,
            value: element.value,
            readonly: element.readonly,
            mandatory: element.mandatory,
            permissions: element.permissions,
            order: element.order,
            editorOptions: this.setEditorConfig(element.type),
            validity: element.validity
          }));
          break;
        case 'LIST':
          const listItem = new ListConfig({
            key: key,
            type: 'list',
            label: this.setDisplayName(element),
            description: element.description,
            value: element.value,
            readonly: element.readonly,
            mandatory: element.mandatory,
            permissions: element.permissions,
            order: element.order,
            validity: element.validity,
          });
          listItem.items = element.items;
          listItem.minimum = element?.minimum;
          listItem.maximum = element?.maximum;
          listItem.length = element?.length;
          listItem.listSize = element?.listSize;
          listItem.properties = element?.properties
          configurations.push(listItem);
          break;

        case 'KVLIST':
          const kvListItem = new KVListConfig({
            key: key,
            type: 'kvlist',
            label: this.setDisplayName(element),
            description: element.description,
            value: element.value,
            readonly: element.readonly,
            mandatory: element.mandatory,
            permissions: element.permissions,
            order: element.order,
            validity: element.validity,
          });
          kvListItem.items = element.items;
          kvListItem.minimum = element?.minimum;
          kvListItem.maximum = element?.maximum;
          kvListItem.length = element?.length;
          kvListItem.listSize = element?.listSize;
          kvListItem.properties = element?.properties;
          kvListItem.options = element?.options;
          configurations.push(kvListItem);
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
            length: element.length,
            readonly: element.readonly,
            mandatory: element.mandatory,
            permissions: element.permissions,
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
      inputStyle: 'textarea',
      autoRefresh: true
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
      group[configuration.key] =
        new UntypedFormControl({ value: configuration.value || '', disabled: this.validateConfigItem(pluginConfiguration, configuration) }, configuration.required ? Validators.required : null)
      // create an file uploader form control for script type
      if (configuration.controlType.toLocaleLowerCase() == 'script') {
        group[configuration.key + '-file-control'] =
          new UntypedFormControl({ value: '', disabled: this.validateConfigItem(pluginConfiguration, configuration) }, configuration.required ? Validators.required : null)
      }
    });
    return new UntypedFormGroup(group);
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
        // generate validation expression on page load based on configuration property values
        config.validityExpression = this.generateValidationExpression(el, config.validityExpression);
      });
      const isValidExpression = this.validateExpression(config.key, config.validityExpression);
      pluginConfiguration[config.key].validityExpression = config?.validityExpression;
      return !isValidExpression;
    }
  }

  checkConfigItemValidityOnChange(form: UntypedFormGroup, config: ConfigurationBase<string>, fullConfiguration: any) {
    // update config value in a global config object
    if (fullConfiguration) {
      fullConfiguration[config.key].value = config.value;
      // buid validation expression
      Object.keys(fullConfiguration).forEach(key => {
        const cnf = fullConfiguration[key];
        if (cnf.validity) {
          let expression = cnf.validity;
          Object.keys(fullConfiguration).forEach(key => {
            const el = fullConfiguration[key];
            // generate validation expression based on changed config item value
            expression = this.generateValidationExpression(el, expression);
          });
          // update validitionExpression property of the configuration item
          cnf.validityExpression = expression;
        }
      });

      // validate expression to enable/disable form control
      Object.keys(fullConfiguration).forEach(key => {
        const cnf = fullConfiguration[key];
        if (cnf.validity) {
          let isValidExpression = this.validateExpression(key, cnf.validityExpression);
          this.setFormControlState(cnf, form, isValidExpression, config);
        }
      });
    }
  }

  /**
   * Validate form control on cofiguration tab switch
   * @param form Configuration control form
   * @param fullConfiguration plugin configuration
   */
  checkConfigItemOnGroupChange(form: UntypedFormGroup, fullConfiguration: any) {
    if (fullConfiguration) {
      Object.keys(fullConfiguration).forEach(key => {
        const cnf = fullConfiguration[key];
        if (cnf.hasOwnProperty('validityExpression')) {
          const isValidExpression = this.validateExpression(key, cnf.validityExpression);
          this.setFormControlState(cnf, form, isValidExpression);
        }
      });
    }
  }

  setFormControlState(cnf: any, form: UntypedFormGroup, validExpression: boolean, configControl = null) {
    if (cnf.key == 'script') {
      if (validExpression) {
        const control = configControl?.key == 'script' ? configControl : cnf;
        form.controls[control.key]?.enable({ emitEvent: false });
        if (!control.file && !control.fileName && !control.value) {
          form.controls[control.key]?.disable({ emitEvent: false });
        }
        form.controls[control.key + '-file-control']?.enable({ emitEvent: false });
      } else {
        form.controls[cnf.key]?.disable({ emitEvent: false });
        form.controls[cnf.key + '-file-control']?.disable({ emitEvent: false });
      }
    }
    else {
      validExpression ? form.controls[cnf.key]?.enable({ emitEvent: false }) : form.controls[cnf.key]?.disable({ emitEvent: false });
    }
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
        console.log('Validity expression', expression, 'for', key, 'evaluated to non-boolean value ', e);
      }
      return e === false ? false : true;
    } catch (e) {
      console.log(e);
      return true;
    }
  }

  getAllACLs() {
    this.aclService.fetchAllACL()
      .subscribe((data: any) => {
        this.acls = orderBy(data.acls, 'name');
        this.acls.unshift({ name: '' }) // add empty acl as first item in the ACLs array to mapped to None text
      }, error => {
        if (error.status === 0) {
          console.log('service down ', error);
        }
      });
  }

  /**
   *
   * @param changedConfiguration edited configuration
   * @param defaultConfiguration Configuration of the plugin
   * @param flag To see if request coming form add or update page
   * @returns updated configuration
   */
  getChangedConfiguration(changedConfiguration: any, defaultConfiguration: any, flag = false) {
    const defaultConfig = map(defaultConfiguration.config, (v, key) => ({ key, ...v }));

    // make a copy of matched config items having changed values
    const matchedConfig = defaultConfig.filter(conf => {
      if (changedConfiguration.hasOwnProperty(conf.key)) {
        if (conf.type == 'JSON') {
          // compare JSON value for changed config
          try {
            const oldJsonValue = JSON.stringify(JSON.parse(conf.value ? conf.value : conf.default), null, ' ');
            const changedJsonValue = JSON.stringify(JSON.parse(changedConfiguration[conf?.key]), null, ' ');
            return oldJsonValue != changedJsonValue;
          } catch (error) {
            console.log('Invalid JSON, ', error);
          }
        }
        return (conf.value ? conf.value : conf.default) !== changedConfiguration[conf.key];
      }
    });

    // make a deep clone copy of matchedConfig array to remove extra keys(not required in payload)
    const matchedConfigCopy = cloneDeep(matchedConfig);

    /**
     * merge new configuration with old configuration,
     * where value key hold changed data in config object
    */
    matchedConfigCopy.forEach(e => e.value = changedConfiguration[e.key]);
    // final array to hold changed configuration
    let finalConfig = [];
    if (flag) {
      matchedConfigCopy.forEach(item => {
        finalConfig.push({
          [item.key]: item.type === 'JSON' ? { value: JSON.parse(item.value) } : { value: item.value }
        });
      });
    } else {
      matchedConfigCopy.forEach(item => {
        finalConfig.push({
          [item.key]: item.type === 'JSON' ? JSON.parse(item.value) : item.value
        });
      });
    }

    // convert finalConfig array in object of objects
    const finalConfiguration = reduce(finalConfig, function (memo, current) { return assign(memo, current); }, {});
    return finalConfiguration;
  }

  getValidConfig(config: any) {
    // remove readonly property form the local configuration copy
    Object.keys(config).forEach(key => {
      if (config[key]?.readonly == 'true') {
        delete config[key];
      }
    })
    return config;
  }

}
