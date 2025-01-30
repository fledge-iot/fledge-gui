import { TestBed } from '@angular/core/testing';

import { FileImportService } from './file-import.service';

describe('FileImportService', () => {
  let service: FileImportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileImportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
