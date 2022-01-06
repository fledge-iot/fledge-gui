import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperationControlComponent } from './operation-control.component';

describe('OperationControlComponent', () => {
  let component: OperationControlComponent;
  let fixture: ComponentFixture<OperationControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OperationControlComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OperationControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
