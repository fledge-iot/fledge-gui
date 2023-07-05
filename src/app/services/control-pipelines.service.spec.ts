import { TestBed, inject } from '@angular/core/testing';

import { ControlPipelinesService } from './control-pipelines.service';

describe('ControlPipelinesService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ControlPipelinesService]
    });
  });

  it('should be created', inject([ControlPipelinesService], (service: ControlPipelinesService) => {
    expect(service).toBeTruthy();
  }));
});
