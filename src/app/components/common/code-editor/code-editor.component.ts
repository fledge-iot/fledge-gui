import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { RolesService } from '../../../services';

type EditorMode = 'json' | 'csv';

@Component({
  selector: 'app-code-editor',
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.css']
})
export class CodeEditorComponent implements OnChanges {
  @Input() mode: EditorMode = 'json';
  @Input() data = '';
  @Output() dataChange = new EventEmitter<string>();

  constructor(public rolesService: RolesService) { }

  public internalData = '';
  public options: any = {
    lineNumbers: true,
    mode: 'application/json',
    autoCloseBrackets: true,
    matchBrackets: true,
    lineWrapping: true,
    foldGutter: true,
    gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter', 'CodeMirror-lint-markers'],
    lint: true,
    inputStyle: 'textarea',
    autoRefresh: true
  };

  ngOnChanges(changes: SimpleChanges) {
    if (changes.mode) {
      this.options = {
        ...this.options,
        readOnly: !this.rolesService.hasEditPermissions(),
        mode: this.mode === 'json' ? 'application/json' : 'text/csv'
      };
    }
    if (changes.data) {
      this.internalData = this.data ?? '';
    }
  }

  public onModelChange(value: string) {
    this.internalData = value;
    this.dataChange.emit(value);
  }
}
