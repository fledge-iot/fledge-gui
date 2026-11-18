import { TestBed } from '@angular/core/testing';

import { ConfigurationControlService } from './configuration-control.service';
import { withAppTestDefaults } from '../testing/app-test-module';

describe('ConfigurationControlService', () => {
  let service: ConfigurationControlService;

  beforeEach(() => {
    TestBed.configureTestingModule(withAppTestDefaults({}));
    service = TestBed.inject(ConfigurationControlService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
