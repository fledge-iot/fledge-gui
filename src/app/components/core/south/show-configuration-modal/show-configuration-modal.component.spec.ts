import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowConfigurationModalComponent } from './show-configuration-modal.component';

describe('ShowConfigurationModalComponent', () => {
  let component: ShowConfigurationModalComponent;
  let fixture: ComponentFixture<ShowConfigurationModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ShowConfigurationModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowConfigurationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
