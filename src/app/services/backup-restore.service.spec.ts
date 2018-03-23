import { TestBed, inject } from '@angular/core/testing';

import { BackupRestoreService } from './backup-restore.service';

describe('BackupRestoreService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BackupRestoreService]
    });
  });

  it('should be created', inject([BackupRestoreService], (service: BackupRestoreService) => {
    expect(service).toBeTruthy();
  }));
});
