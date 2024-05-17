import { TestBed } from '@angular/core/testing';

import { FlowEditorService } from './flow-editor.service';

describe('FlowEditorService', () => {
  let service: FlowEditorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FlowEditorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
