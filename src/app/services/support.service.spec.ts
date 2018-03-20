import { TestBed, inject } from '@angular/core/testing';

import { SupportService } from './support.service';

describe('SupportService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SupportService]
    });
  });

  it('should be created', inject([SupportService], (service: SupportService) => {
    expect(service).toBeTruthy();
  }));
});
