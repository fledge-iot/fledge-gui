import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddConfigItemComponent } from './add-config-item.component';

describe('AddConfigItemComponent', () => {
  let component: AddConfigItemComponent;
  let fixture: ComponentFixture<AddConfigItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddConfigItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddConfigItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
