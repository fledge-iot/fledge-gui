import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicGroupComponent } from './dynamic-group.component';
import { withAppTestDefaults } from '../../../../testing/app-test-module';

describe('DynamicGroupComponent', () => {
  let component: DynamicGroupComponent;
  let fixture: ComponentFixture<DynamicGroupComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [DynamicGroupComponent]
    }));
    fixture = TestBed.createComponent(DynamicGroupComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('selectedGroup', { key: 'basic' });
    fixture.componentRef.setInput('group', { group: { key: 'basic' }, config: {} });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
