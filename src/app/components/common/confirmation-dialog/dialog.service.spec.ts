import { TestBed } from '@angular/core/testing';

import { DialogService } from './dialog.service';
import { withAppTestDefaults } from '../../../testing/app-test-module';

describe('DialogService', () => {
  let service: DialogService;

  beforeEach(() => {
    TestBed.configureTestingModule(withAppTestDefaults({}));
    service = TestBed.inject(DialogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
