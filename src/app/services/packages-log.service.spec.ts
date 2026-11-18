import { TestBed } from '@angular/core/testing';

import { PackagesLogService } from './packages-log.service';

describe('PackagesLogService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PackagesLogService = TestBed.inject(PackagesLogService);
    expect(service).toBeTruthy();
  });
});
