import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicGroupComponent } from './dynamic-group.component';

describe('DynamicGroupComponent', () => {
  let component: DynamicGroupComponent;
  let fixture: ComponentFixture<DynamicGroupComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DynamicGroupComponent]
    });
    fixture = TestBed.createComponent(DynamicGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
