import { ClassicPreset } from 'rete';
import { FormControl, FormGroup, NgForm } from '@angular/forms';

export const PROPERTY_CONFIGURATION = {
  key: 'host',
  type: 'string',
  description: 'Host name',
  displayName: 'Host',
  default: 'localhost',
  value: 'localhost',
  order: '1',
  length: '50'
};

export const LIST_CONFIGURATION = {
  key: 'readings',
  type: 'list',
  items: 'object',
  description: 'Readings to collect',
  displayName: 'Readings',
  default: '[]',
  value: '[{"name": "temperature", "unit": "C"}]',
  order: '1',
  permissions: [],
  properties: {
    name: { type: 'string', description: 'Reading name', displayName: 'Name', default: '' },
    unit: { type: 'string', description: 'Reading unit', displayName: 'Unit', default: '' }
  }
};

export const KVLIST_CONFIGURATION = {
  key: 'mapping',
  type: 'kvlist',
  items: 'object',
  description: 'Key value mapping',
  displayName: 'Mapping',
  default: '{}',
  value: '{"first": {"name": "temperature", "unit": "C"}}',
  order: '1',
  keyName: 'Key',
  keyDescription: 'Mapping key',
  permissions: [],
  properties: LIST_CONFIGURATION.properties
};

export const BUCKET_CONFIGURATION = {
  key: 'bucket',
  type: 'bucket',
  description: 'Bucket settings',
  displayName: 'Bucket',
  default: '{}',
  value: '{"size": "10"}',
  order: '1',
  properties: {
    key: {},
    properties: {
      size: { type: 'integer', description: 'Bucket size', displayName: 'Size', default: '10', order: '1' }
    }
  }
};

export const LIST_ITEM_PROPERTIES = [
  { key: 'name', label: 'Name', value: 'temperature' },
  { key: 'unit', label: 'Unit', value: 'C' }
];

export const MODAL_MESSAGE = { key: 'test', message: 'Confirm the action' };

export function createNodeData(label: string): any {
  return new ClassicPreset.Node(label);
}

export function noop(): void { }

export function createStepForm(kind: 'write' | 'operation' | 'script'): NgForm {
  const form = new NgForm([], []);
  form.form.addControl('steps', new FormGroup({
    'step-0': new FormGroup({
      [kind]: new FormGroup({
        order: new FormControl(0),
        service: new FormControl(''),
        name: new FormControl('step-name'),
        values: new FormControl({}),
        condition: new FormControl(''),
        execution: new FormControl('')
      })
    })
  }));
  return form;
}

export function createDebugDisplayNodeData(): any {
  return Object.assign(createNodeData('Debug'), {
    type: 'debug-data-display',
    debugData: { readings: [] }
  });
}
