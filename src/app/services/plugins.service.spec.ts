import { TestBed } from '@angular/core/testing';

import { PluginsService } from './plugins.service';

describe('PluginsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PluginsService = TestBed.get(PluginsService);
    expect(service).toBeTruthy();
  });
});
