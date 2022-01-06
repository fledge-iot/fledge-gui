import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WriteControlComponent } from './write-control.component';

describe('WriteControlComponent', () => {
  let component: WriteControlComponent;
  let fixture: ComponentFixture<WriteControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WriteControlComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WriteControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
