import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RestartModalComponent } from './restart-modal.component';
import { withAppTestDefaults } from '../../../testing/app-test-module';
import { MODAL_MESSAGE } from '../../../testing/fixtures';

describe('RestartModalComponent', () => {
  let component: RestartModalComponent;
  let fixture: ComponentFixture<RestartModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ RestartModalComponent ]
    }))
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RestartModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('restartData', MODAL_MESSAGE);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
