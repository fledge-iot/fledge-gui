import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddWriteComponent } from './add-write.component';

describe('AddWriteComponent', () => {
  let component: AddWriteComponent;
  let fixture: ComponentFixture<AddWriteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddWriteComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddWriteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
