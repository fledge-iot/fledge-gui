import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlowAPIComponent } from './flow-api.component';

describe('FlowAPIComponent', () => {
  let component: FlowAPIComponent;
  let fixture: ComponentFixture<FlowAPIComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FlowAPIComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FlowAPIComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
