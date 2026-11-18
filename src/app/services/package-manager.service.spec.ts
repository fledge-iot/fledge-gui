import { TestBed } from '@angular/core/testing';

import { PackageManagerService } from './package-manager.service';
import { withAppTestDefaults } from '../testing/app-test-module';

describe('PackageManagerService', () => {
  let service: PackageManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule(withAppTestDefaults({}));
    service = TestBed.inject(PackageManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
