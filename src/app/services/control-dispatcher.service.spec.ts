import { TestBed } from '@angular/core/testing';

import { ControlDispatcherService } from './control-dispatcher.service';

describe('ControlDispatcherService', () => {
  let service: ControlDispatcherService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ControlDispatcherService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
