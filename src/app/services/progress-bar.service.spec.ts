import { TestBed } from '@angular/core/testing';

import { ProgressBarService } from './progress-bar.service';
import { withAppTestDefaults } from '../testing/app-test-module';

describe('ProgressBarService', () => {
  beforeEach(() => TestBed.configureTestingModule(withAppTestDefaults({})));

  it('should be created', () => {
    const service: ProgressBarService = TestBed.inject(ProgressBarService);
    expect(service).toBeTruthy();
  });
});
