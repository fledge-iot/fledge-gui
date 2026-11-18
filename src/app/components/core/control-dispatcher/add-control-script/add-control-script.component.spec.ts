import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddControlScriptComponent } from './add-control-script.component';
import { withAppTestDefaults } from '../../../../testing/app-test-module';

describe('AddControlScriptComponent', () => {
  let component: AddControlScriptComponent;
  let fixture: ComponentFixture<AddControlScriptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ AddControlScriptComponent ]
    }))
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddControlScriptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
