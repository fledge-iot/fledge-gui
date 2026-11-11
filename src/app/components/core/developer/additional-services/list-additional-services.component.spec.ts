import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListAdditionalServicesComponent } from './list-additional-services.component';
import { withAppTestDefaults } from '../../../../testing/app-test-module';

describe('ListAdditionalServicesComponent', () => {
  let component: ListAdditionalServicesComponent;
  let fixture: ComponentFixture<ListAdditionalServicesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ ListAdditionalServicesComponent ]
    }))
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListAdditionalServicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
