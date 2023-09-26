import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditFlowAPIComponent } from './add-edit-api-flow.component';

describe('AddEditFlowAPIComponent', () => {
  let component: AddEditFlowAPIComponent;
  let fixture: ComponentFixture<AddEditFlowAPIComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddEditFlowAPIComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddEditFlowAPIComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
