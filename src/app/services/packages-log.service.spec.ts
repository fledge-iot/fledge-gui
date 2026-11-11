import { TestBed } from '@angular/core/testing';

import { PackagesLogService } from './packages-log.service';
import { withAppTestDefaults } from '../testing/app-test-module';

describe('PackagesLogService', () => {
  beforeEach(() => TestBed.configureTestingModule(withAppTestDefaults({})));

  it('should be created', () => {
    const service: PackagesLogService = TestBed.inject(PackagesLogService);
    expect(service).toBeTruthy();
  });
});
