import { TestBed } from '@angular/core/testing';

import { ConfigurationControlService } from './configuration-control.service';

describe('ConfigurationControlService', () => {
  let service: ConfigurationControlService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfigurationControlService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
