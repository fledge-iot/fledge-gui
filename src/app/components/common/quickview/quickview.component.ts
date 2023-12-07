import { Component, OnInit } from '@angular/core';
import * as bulmaQuickview from './../../../../../node_modules/bulma-quickview/dist/js/bulma-quickview.min.js'

@Component({
  selector: 'app-quickview',
  templateUrl: './quickview.component.html',
  styleUrls: ['./quickview.component.css']
})
export class QuickviewComponent implements OnInit {

  title = "Quickview title";

  constructor() {
  }

  ngOnInit(): void {
    setTimeout(()=>{
      bulmaQuickview.attach();
    }, 1000)
  }

}
