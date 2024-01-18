import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListManageServicesComponent } from './list-manage-services.component';

describe('ListManageServicesComponent', () => {
  let component: ListManageServicesComponent;
  let fixture: ComponentFixture<ListManageServicesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListManageServicesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListManageServicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
