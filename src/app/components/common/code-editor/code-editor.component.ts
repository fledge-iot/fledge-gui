import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

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

  public internalData = '';
  public options: any = {
    lineNumbers: true,
    theme: 'material',
    mode: 'application/json',
    gutters: ['CodeMirror-lint-markers'],
    autoCloseBrackets: true,
    matchBrackets: true
  };

  ngOnChanges(changes: SimpleChanges) {
    if (changes.mode) {
      this.options = {
        ...this.options,
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


