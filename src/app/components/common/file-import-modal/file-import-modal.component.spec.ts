import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileImportModalComponent } from './file-import-modal.component';
import { withAppTestDefaults } from '../../../testing/app-test-module';
import { LIST_CONFIGURATION } from '../../../testing/fixtures';

describe('FileImportModalComponent', () => {
  let component: FileImportModalComponent;
  let fixture: ComponentFixture<FileImportModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [FileImportModalComponent]
    }));
    fixture = TestBed.createComponent(FileImportModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('configuration', LIST_CONFIGURATION);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
