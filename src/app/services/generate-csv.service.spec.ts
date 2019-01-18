import { TestBed } from '@angular/core/testing';

import { GenerateCsvService } from './generate-csv.service';

describe('GenerateCsvService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: GenerateCsvService = TestBed.get(GenerateCsvService);
    expect(service).toBeTruthy();
  });
});
