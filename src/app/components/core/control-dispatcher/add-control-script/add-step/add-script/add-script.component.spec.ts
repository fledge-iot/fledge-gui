import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddScriptComponent } from './add-script.component';

describe('AddScriptComponent', () => {
  let component: AddScriptComponent;
  let fixture: ComponentFixture<AddScriptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddScriptComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddScriptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
