import { ComponentFixture, TestBed } from '@angular/core/testing';

import { APIFlowComponent } from './api-flow.component';

describe('APIFlowComponent', () => {
  let component: APIFlowComponent;
  let fixture: ComponentFixture<APIFlowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ APIFlowComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(APIFlowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
