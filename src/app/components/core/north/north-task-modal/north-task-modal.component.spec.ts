import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NorthTaskModalComponent } from './north-task-modal.component';
import { withAppTestDefaults } from '../../../../testing/app-test-module';

describe('NorthTaskModalComponent', () => {
  let component: NorthTaskModalComponent;
  let fixture: ComponentFixture<NorthTaskModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ NorthTaskModalComponent ]
    }))
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
