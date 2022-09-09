import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PluginPersistDataComponent } from './plugin-persist-data.component';

describe('PluginPersistDataComponent', () => {
  let component: PluginPersistDataComponent;
  let fixture: ComponentFixture<PluginPersistDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PluginPersistDataComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PluginPersistDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
