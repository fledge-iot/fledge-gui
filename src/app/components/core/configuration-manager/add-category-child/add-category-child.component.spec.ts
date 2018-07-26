import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCategoryChildComponent } from './add-category-child.component';

describe('AddCategoryChildComponent', () => {
  let component: AddCategoryChildComponent;
  let fixture: ComponentFixture<AddCategoryChildComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddCategoryChildComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddCategoryChildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
