import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ManageServiceModalComponent } from './manage-service-modal.component';

describe('ManageServiceModalComponent', () => {
  let component: ManageServiceModalComponent;
  let fixture: ComponentFixture<ManageServiceModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ManageServiceModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageServiceModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
