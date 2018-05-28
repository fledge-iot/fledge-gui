import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificateStoreComponent } from './certificate-store.component';

describe('CertificateStoreComponent', () => {
  let component: CertificateStoreComponent;
  let fixture: ComponentFixture<CertificateStoreComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CertificateStoreComponent ]
    })
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
