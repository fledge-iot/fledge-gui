import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomNodeComponent } from './custom-node.component';
import { withAppTestDefaults } from '../../../../testing/app-test-module';
import { createDebugDisplayNodeData, noop } from '../../../../testing/fixtures';

describe('CustomNodeComponent', () => {
  let component: CustomNodeComponent;
  let fixture: ComponentFixture<CustomNodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ CustomNodeComponent ]
    }))
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomNodeComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('data', createDebugDisplayNodeData());
    fixture.componentRef.setInput('emit', noop);
    fixture.componentRef.setInput('rendered', noop);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
