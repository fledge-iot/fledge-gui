import { TestBed, inject } from '@angular/core/testing';

import { SupportService } from './support.service';
import { withAppTestDefaults } from '../testing/app-test-module';

describe('SupportService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      providers: [SupportService]
    }));
  });

  it('should be created', inject([SupportService], (service: SupportService) => {
    expect(service).toBeTruthy();
  }));
});
