import { TestBed, inject } from '@angular/core/testing';

import { SystemAlertService } from './system-alert.service';

describe('SystemAlertService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SystemAlertService]
    });
  });

  it('should be created', inject([SystemAlertService], (service: SystemAlertService) => {
    expect(service).toBeTruthy();
  }));
});
