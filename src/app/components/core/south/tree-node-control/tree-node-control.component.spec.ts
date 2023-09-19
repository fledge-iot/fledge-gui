import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreeNodeControlComponent } from './tree-node-control.component';

describe('TreeNodeControlComponent', () => {
  let component: TreeNodeControlComponent;
  let fixture: ComponentFixture<TreeNodeControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TreeNodeControlComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TreeNodeControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
