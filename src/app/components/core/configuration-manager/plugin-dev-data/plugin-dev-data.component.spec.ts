import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PluginDevDataComponent } from './plugin-dev-data.component';

describe('PluginDevDataComponent', () => {
  let component: PluginDevDataComponent;
  let fixture: ComponentFixture<PluginDevDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PluginDevDataComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PluginDevDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
