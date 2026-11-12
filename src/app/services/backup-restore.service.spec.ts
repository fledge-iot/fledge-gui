import { TestBed, inject } from '@angular/core/testing';

import { BackupRestoreService } from './backup-restore.service';
import { withAppTestDefaults } from '../testing/app-test-module';

describe('BackupRestoreService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      providers: [BackupRestoreService]
    }));
  });

  it('should be created', inject([BackupRestoreService], (service: BackupRestoreService) => {
    expect(service).toBeTruthy();
  }));
});
