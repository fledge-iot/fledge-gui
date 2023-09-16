import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterPipelineNodesComponent } from './filter-pipeline-nodes.component';

describe('FilterPipelineNodesComponent', () => {
  let component: FilterPipelineNodesComponent;
  let fixture: ComponentFixture<FilterPipelineNodesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FilterPipelineNodesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterPipelineNodesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
