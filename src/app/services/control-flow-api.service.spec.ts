import { TestBed } from '@angular/core/testing';

import { ControlFlowAPIService } from './control-flow-api.service';

describe('ControlFlowAPI', () => {
  let service: ControlFlowAPIService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ControlFlowAPIService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
