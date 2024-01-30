import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import * as bulmaQuickview from './../../../../../node_modules/bulma-quickview/dist/js/bulma-quickview.min.js'

@Component({
  selector: 'app-quickview',
  templateUrl: './quickview.component.html',
  styleUrls: ['./quickview.component.css']
})
export class QuickviewComponent implements OnInit {

  @ViewChild('quickView') quickView;

  constructor() {
  }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    this.quickView.nativeElement.classList.remove('is-active');
  }
  
  ngOnInit(): void {
    var count = 0;
    let intervalId = setInterval(() => {
      bulmaQuickview.attach();
      count++;
      if (count == 100) {
        clearInterval(intervalId)
      }
    }, 100)
  }

}
