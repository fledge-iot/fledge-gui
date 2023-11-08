import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BucketConfigurationComponent } from './bucket-configuration.component';

describe('BucketConfigurationComponent', () => {
  let component: BucketConfigurationComponent;
  let fixture: ComponentFixture<BucketConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BucketConfigurationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BucketConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
