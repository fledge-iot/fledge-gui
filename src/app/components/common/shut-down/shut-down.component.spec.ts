import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ShutdownModalComponent } from './shutdown-modal.component';
import { withAppTestDefaults } from '../../../testing/app-test-module';
import { MODAL_MESSAGE } from '../../../testing/fixtures';

describe('ShutdownModalComponent', () => {
  let component: ShutdownModalComponent;
  let fixture: ComponentFixture<ShutdownModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ ShutdownModalComponent ]
    }))
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShutdownModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('shutDownData', MODAL_MESSAGE);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
