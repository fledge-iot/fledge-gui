import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

import 'codemirror/mode/python/python';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/brace-fold';
import 'codemirror/lib/codemirror';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/addon/lint/lint';
import 'codemirror/addon/lint/json-lint';
import jsonlint from 'jsonlint-mod';

declare global {
  interface Window { jsonlint: any; }
}

window.jsonlint = jsonlint;

if (environment.production) {
  enableProdMode();
  // if (window) {
  //   window.console.log = function () { };
  // }
}

platformBrowserDynamic().bootstrapModule(AppModule);
