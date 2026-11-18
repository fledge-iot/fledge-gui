import { TestBed, inject } from '@angular/core/testing';

import { UserService } from './user.service';
import { withAppTestDefaults } from '../testing/app-test-module';

describe('UserService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      providers: [UserService]
    }));
  });

  it('should be created', inject([UserService], (service: UserService) => {
    expect(service).toBeTruthy();
  }));
});
