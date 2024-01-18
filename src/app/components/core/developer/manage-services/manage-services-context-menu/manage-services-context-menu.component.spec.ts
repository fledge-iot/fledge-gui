import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageServicesContextMenuComponent } from './manage-services-context-menu.component';

describe('ManageServicesContextMenuComponent', () => {
  let component: ManageServicesContextMenuComponent;
  let fixture: ComponentFixture<ManageServicesContextMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManageServicesContextMenuComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageServicesContextMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
