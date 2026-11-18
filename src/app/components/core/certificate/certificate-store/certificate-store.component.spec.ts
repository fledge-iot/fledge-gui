import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CertificateStoreComponent } from './certificate-store.component';
import { withAppTestDefaults } from '../../../../testing/app-test-module';

describe('CertificateStoreComponent', () => {
  let component: CertificateStoreComponent;
  let fixture: ComponentFixture<CertificateStoreComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ CertificateStoreComponent ]
    }))
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CertificateStoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
