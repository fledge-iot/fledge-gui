import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificateBaseLoginComponent } from './certificate-base-login.component';

describe('CertificateBaseLoginComponent', () => {
  let component: CertificateBaseLoginComponent;
  let fixture: ComponentFixture<CertificateBaseLoginComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CertificateBaseLoginComponent ]
    })
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
