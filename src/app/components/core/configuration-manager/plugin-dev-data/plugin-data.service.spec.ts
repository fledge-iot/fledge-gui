import { TestBed } from '@angular/core/testing';

import { PluginDataService } from './plugin-data.service';

describe('PluginDataService', () => {
  let service: PluginDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PluginDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
