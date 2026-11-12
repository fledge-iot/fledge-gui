import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeEditorComponent } from './node-editor.component';
import { withAppTestDefaults } from '../../../testing/app-test-module';

describe('NodeEditorComponent', () => {
  let component: NodeEditorComponent;
  let fixture: ComponentFixture<NodeEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ NodeEditorComponent ]
    }))
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
