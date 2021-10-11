import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NorthTaskModalComponent } from './north-task-modal.component';

describe('NorthTaskModalComponent', () => {
  let component: NorthTaskModalComponent;
  let fixture: ComponentFixture<NorthTaskModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ NorthTaskModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NorthTaskModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
