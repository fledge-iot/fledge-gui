import { TestBed } from '@angular/core/testing';

import { ControlAPIFlowService } from './control-api-flow.service';

describe('ControlAPIFlow', () => {
  let service: ControlAPIFlowService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ControlAPIFlowService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
