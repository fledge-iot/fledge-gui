import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CertificateBaseLoginComponent } from './certificate-base-login.component';
import { withAppTestDefaults } from '../../../testing/app-test-module';

describe('CertificateBaseLoginComponent', () => {
  let component: CertificateBaseLoginComponent;
  let fixture: ComponentFixture<CertificateBaseLoginComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ CertificateBaseLoginComponent ]
    }))
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CertificateBaseLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
