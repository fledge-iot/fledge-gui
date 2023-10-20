import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddControlPipelineComponent } from './add-control-pipeline.component';

describe('AddControlPipelineComponent', () => {
  let component: AddControlPipelineComponent;
  let fixture: ComponentFixture<AddControlPipelineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddControlPipelineComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddControlPipelineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
