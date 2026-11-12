import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomConnectionComponent } from './custom-connection.component';
import { withAppTestDefaults } from '../../../../testing/app-test-module';

describe('CustomConnectionComponent', () => {
  let component: CustomConnectionComponent;
  let fixture: ComponentFixture<CustomConnectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ CustomConnectionComponent ]
    }))
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomConnectionComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('data', { id: 'connection-1', selected: false, click: () => { } });
    fixture.componentRef.setInput('path', 'M 0 0 L 10 10');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
