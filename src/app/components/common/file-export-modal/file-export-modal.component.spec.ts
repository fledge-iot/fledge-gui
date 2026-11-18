import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileExportModalComponent } from './file-export-modal.component';
import { withAppTestDefaults } from '../../../testing/app-test-module';
import { LIST_CONFIGURATION } from '../../../testing/fixtures';

describe('FileExportModalComponent', () => {
  let component: FileExportModalComponent;
  let fixture: ComponentFixture<FileExportModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [FileExportModalComponent]
    }));
    fixture = TestBed.createComponent(FileExportModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('configuration', LIST_CONFIGURATION);
    fixture.componentRef.setInput('data', []);
    fixture.componentRef.setInput('categoryName', 'South');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
