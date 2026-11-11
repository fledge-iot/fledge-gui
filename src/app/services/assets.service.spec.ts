import { TestBed, inject } from '@angular/core/testing';

import { AssetsService } from './assets.service';
import { withAppTestDefaults } from '../testing/app-test-module';

describe('AssetsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      providers: [AssetsService]
    }));
  });

  it('should be created', inject([AssetsService], (service: AssetsService) => {
    expect(service).toBeTruthy();
  }));
});
