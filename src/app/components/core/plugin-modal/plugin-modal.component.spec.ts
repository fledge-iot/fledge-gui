import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PluginModalComponent } from './plugin-modal.component';
import { withAppTestDefaults } from '../../../testing/app-test-module';

describe('PluginModalComponent', () => {
  let component: PluginModalComponent;
  let fixture: ComponentFixture<PluginModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ PluginModalComponent ]
    }))
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PluginModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('data', { modalState: false, type: 'south' });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
