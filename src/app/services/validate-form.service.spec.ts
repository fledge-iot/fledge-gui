import { TestBed } from '@angular/core/testing';

import { ValidateFormService } from './validate-form.service';

describe('ValidateFormService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ValidateFormService = TestBed.get(ValidateFormService);
    expect(service).toBeTruthy();
  });
});
