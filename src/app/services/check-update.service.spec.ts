import { TestBed, inject } from '@angular/core/testing';
import { CheckUpdateService } from './check-update.service';

describe('CheckUpdateService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CheckUpdateService]
    });
  });

  it('should be created', inject([CheckUpdateService], (service: CheckUpdateService) => {
    expect(service).toBeTruthy();
  }));
});
