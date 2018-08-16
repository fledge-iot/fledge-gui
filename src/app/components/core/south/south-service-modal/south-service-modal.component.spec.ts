import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SouthServiceModalComponent } from './south-service-modal.component';

describe('SouthServiceModalComponent', () => {
  let component: SouthServiceModalComponent;
  let fixture: ComponentFixture<SouthServiceModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SouthServiceModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SouthServiceModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
