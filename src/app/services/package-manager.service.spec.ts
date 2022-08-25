import { TestBed } from '@angular/core/testing';

import { PackageManagerService } from './package-manager.service';

describe('PackageManagerService', () => {
  let service: PackageManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PackageManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
