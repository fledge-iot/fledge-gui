import { TestBed } from '@angular/core/testing';

import { FlowEditorService } from './flow-editor.service';
import { withAppTestDefaults } from '../../../testing/app-test-module';

describe('FlowEditorService', () => {
  let service: FlowEditorService;

  beforeEach(() => {
    TestBed.configureTestingModule(withAppTestDefaults({}));
    service = TestBed.inject(FlowEditorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
