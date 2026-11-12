import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddConfigureComponent } from './add-configure.component';
import { withAppTestDefaults } from '../../../../../../testing/app-test-module';

describe('AddConfigureComponent', () => {
  let component: AddConfigureComponent;
  let fixture: ComponentFixture<AddConfigureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ AddConfigureComponent ]
    }))
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddConfigureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
