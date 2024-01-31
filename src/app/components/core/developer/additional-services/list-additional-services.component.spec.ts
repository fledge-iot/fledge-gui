import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListAdditionalServicesComponent } from './list-additional-services.component';

describe('ListAdditionalServicesComponent', () => {
  let component: ListAdditionalServicesComponent;
  let fixture: ComponentFixture<ListAdditionalServicesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListAdditionalServicesComponent ]
    })
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
