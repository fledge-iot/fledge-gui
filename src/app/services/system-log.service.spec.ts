import { TestBed, inject } from '@angular/core/testing';

import { SystemLogService } from './system-log.service';
import { withAppTestDefaults } from '../testing/app-test-module';

describe('SystemLogService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      providers: [SystemLogService]
    }));
  });

  it('should be created', inject([SystemLogService], (service: SystemLogService) => {
    expect(service).toBeTruthy();
  }));
});
