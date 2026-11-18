import { TestBed, inject } from '@angular/core/testing';
import { AuditService } from './audit.service';
import { withAppTestDefaults } from '../testing/app-test-module';

describe('AuditService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      providers: [AuditService]
    }));
  });

  it('should be created', inject([AuditService], (service: AuditService) => {
    expect(service).toBeTruthy();
  }));
});
