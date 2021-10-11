import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PluginModalComponent } from './plugin-modal.component';

describe('PluginModalComponent', () => {
  let component: PluginModalComponent;
  let fixture: ComponentFixture<PluginModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PluginModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PluginModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
