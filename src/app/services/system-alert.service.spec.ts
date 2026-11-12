import { TestBed, inject } from '@angular/core/testing';

import { SystemAlertService } from './system-alert.service';
import { withAppTestDefaults } from '../testing/app-test-module';

describe('SystemAlertService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      providers: [SystemAlertService]
    }));
  });

  it('should be created', inject([SystemAlertService], (service: SystemAlertService) => {
    expect(service).toBeTruthy();
  }));
});
