import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomSocketComponent } from './custom-socket.component';
import { withAppTestDefaults } from '../../../../testing/app-test-module';

describe('CustomSocketComponent', () => {
  let component: CustomSocketComponent;
  let fixture: ComponentFixture<CustomSocketComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ CustomSocketComponent ]
    }))
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomSocketComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
