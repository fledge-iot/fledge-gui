import { TestBed } from '@angular/core/testing';

import { ControlAPIFlowService } from './control-api-flow.service';
import { withAppTestDefaults } from '../testing/app-test-module';

describe('ControlAPIFlow', () => {
  let service: ControlAPIFlowService;

  beforeEach(() => {
    TestBed.configureTestingModule(withAppTestDefaults({}));
    service = TestBed.inject(ControlAPIFlowService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
