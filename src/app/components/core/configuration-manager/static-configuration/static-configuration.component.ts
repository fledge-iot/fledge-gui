import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { RolesService } from '../../../../services';

@Component({
  standalone: true,
  selector: 'app-static-configuration',
  templateUrl: './static-configuration.component.html',
  styleUrls: ['./static-configuration.component.css'],
  imports: [CommonModule, CodemirrorModule, FormsModule]
})
export class StaticConfigurationComponent {
  @Input() configuration;
  constructor(public rolesService: RolesService) { }

  public codeMirrorConfiguration(type: string) {
    const editorOptions = {
      mode: 'text/x-python',
      lineNumbers: true,
      lineWrapping: true,
      foldGutter: true,
      gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter', 'CodeMirror-lint-markers'],
      autoCloseBrackets: true,
      matchBrackets: true,
      lint: true,
      inputStyle: 'textarea',
      autoRefresh: true
    };
    if (type === 'JSON') {
      editorOptions.mode = 'application/json';
    }
    return editorOptions;
  }
}
