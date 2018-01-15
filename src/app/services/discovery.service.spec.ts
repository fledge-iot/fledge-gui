import { TestBed, inject } from '@angular/core/testing';

import { DiscoveryService } from './discovery.service';

describe('DiscoveryService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DiscoveryService]
    });
  });

  it('should be created', inject([DiscoveryService], (service: DiscoveryService) => {
    expect(service).toBeTruthy();
  }));
});
