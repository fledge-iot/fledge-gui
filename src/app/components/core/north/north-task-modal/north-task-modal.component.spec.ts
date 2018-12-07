import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NorthTaskModalComponent } from './north-task-modal.component';

describe('NorthTaskModalComponent', () => {
  let component: NorthTaskModalComponent;
  let fixture: ComponentFixture<NorthTaskModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NorthTaskModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NorthTaskModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
