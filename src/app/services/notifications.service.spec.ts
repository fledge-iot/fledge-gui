import { TestBed } from '@angular/core/testing';

import { NotificationsService } from './notifications.service';
import { withAppTestDefaults } from '../testing/app-test-module';

describe('NotificationsService', () => {
  beforeEach(() => TestBed.configureTestingModule(withAppTestDefaults({})));

  it('should be created', () => {
    const service: NotificationsService = TestBed.inject(NotificationsService);
    expect(service).toBeTruthy();
  });
});
