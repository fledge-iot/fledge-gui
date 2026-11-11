import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BucketConfigurationComponent } from './bucket-configuration.component';
import { withAppTestDefaults } from '../../../../testing/app-test-module';
import { BUCKET_CONFIGURATION } from '../../../../testing/fixtures';

describe('BucketConfigurationComponent', () => {
  let component: BucketConfigurationComponent;
  let fixture: ComponentFixture<BucketConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ BucketConfigurationComponent ]
    }))
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BucketConfigurationComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('dataModel', { ...BUCKET_CONFIGURATION });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
