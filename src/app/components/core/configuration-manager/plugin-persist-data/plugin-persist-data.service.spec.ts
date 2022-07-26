import { TestBed } from '@angular/core/testing';

import { PluginPersistDataService } from './plugin-persist-data.service';

describe('PluginPersistDataService', () => {
  let service: PluginPersistDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PluginPersistDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
