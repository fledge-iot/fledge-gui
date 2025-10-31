import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { RolesService } from '../../../services';
import { DelimiterStoreService } from '../../../services/delimiter-store.service';

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
  @Input() selectedDelimiter: string = ',';
  @Output() delimiterChange = new EventEmitter<string>();

  constructor(public rolesService: RolesService,
    public delimiterStore: DelimiterStoreService
  ) { }

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

  ngOnInit() {
    this.selectedDelimiter = this.delimiterStore.getDelimiter() || ',';
  }

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
    console.log(changes);

    this.selectedDelimiter = this.delimiterStore.getDelimiter() || ',';

  }

  public onModelChange(value: string) {
    this.internalData = value;
    this.dataChange.emit(value);
  }

  // Dropdown options for CSV delimiters
  public delimiterOptions = [
    { value: ',', label: 'Comma (,)', symbol: ',' },
    { value: ';', label: 'Semicolon (;)', symbol: ';' },
    { value: '\t', label: 'Tab', symbol: 'Tab' },
    { value: '|', label: 'Pipe (|)', symbol: '|' },
    { value: ':', label: 'Colon (:)', symbol: ':' }
  ];

  public onDelimiterSelect(value: string) {
    this.delimiterChange.emit(value);
  }
}
