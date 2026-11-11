import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UploadCertificateComponent } from './upload-certificate.component';
import { withAppTestDefaults } from '../../../../testing/app-test-module';

describe('UploadCertificateComponent', () => {
  let component: UploadCertificateComponent;
  let fixture: ComponentFixture<UploadCertificateComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ UploadCertificateComponent ]
    }))
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadCertificateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
