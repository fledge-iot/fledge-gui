import { TestBed } from '@angular/core/testing';

import { FileImportService } from './file-import.service';
import { withAppTestDefaults } from '../testing/app-test-module';

describe('FileImportService', () => {
  let service: FileImportService;

  beforeEach(() => {
    TestBed.configureTestingModule(withAppTestDefaults({}));
    service = TestBed.inject(FileImportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
