import { TestBed } from '@angular/core/testing';

import { GenerateCsvService } from './generate-csv.service';
import { withAppTestDefaults } from '../testing/app-test-module';

describe('GenerateCsvService', () => {
  beforeEach(() => TestBed.configureTestingModule(withAppTestDefaults({})));

  it('should be created', () => {
    const service: GenerateCsvService = TestBed.inject(GenerateCsvService);
    expect(service).toBeTruthy();
  });
});
