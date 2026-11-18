import { TestBed } from '@angular/core/testing';

import { PluginPersistDataService } from './plugin-persist-data.service';
import { withAppTestDefaults } from '../../../../testing/app-test-module';

describe('PluginPersistDataService', () => {
  let service: PluginPersistDataService;

  beforeEach(() => {
    TestBed.configureTestingModule(withAppTestDefaults({}));
    service = TestBed.inject(PluginPersistDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
