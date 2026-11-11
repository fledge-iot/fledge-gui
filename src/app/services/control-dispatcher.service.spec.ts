import { TestBed } from '@angular/core/testing';

import { ControlDispatcherService } from './control-dispatcher.service';
import { withAppTestDefaults } from '../testing/app-test-module';

describe('ControlDispatcherService', () => {
  let service: ControlDispatcherService;

  beforeEach(() => {
    TestBed.configureTestingModule(withAppTestDefaults({}));
    service = TestBed.inject(ControlDispatcherService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
