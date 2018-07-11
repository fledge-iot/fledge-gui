import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReadingsGraphComponent } from './readings-graph.component';

describe('ReadingsGraphComponent', () => {
  let component: ReadingsGraphComponent;
  let fixture: ComponentFixture<ReadingsGraphComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReadingsGraphComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReadingsGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
