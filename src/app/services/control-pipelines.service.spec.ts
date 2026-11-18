import { TestBed, inject } from '@angular/core/testing';

import { ControlPipelinesService } from './control-pipelines.service';
import { withAppTestDefaults } from '../testing/app-test-module';

describe('ControlPipelinesService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      providers: [ControlPipelinesService]
    }));
  });

  it('should be created', inject([ControlPipelinesService], (service: ControlPipelinesService) => {
    expect(service).toBeTruthy();
  }));
});
