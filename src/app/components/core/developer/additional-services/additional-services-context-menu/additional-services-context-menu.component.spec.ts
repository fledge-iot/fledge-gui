import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdditionalServicesContextMenuComponent } from './additional-services-context-menu.component';

describe('AdditionalServicesContextMenuComponent', () => {
  let component: AdditionalServicesContextMenuComponent;
  let fixture: ComponentFixture<AdditionalServicesContextMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdditionalServicesContextMenuComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdditionalServicesContextMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
