import { Component, OnInit } from '@angular/core';
import * as bulmaQuickview from './../../../../../node_modules/bulma-quickview/dist/js/bulma-quickview.min.js'
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-quickview',
  templateUrl: './quickview.component.html',
  styleUrls: ['./quickview.component.css']
})
export class QuickviewComponent implements OnInit {

  title = "Quickview title";
  source = "";

  constructor(private route: ActivatedRoute,) {
    this.route.queryParams.subscribe(params => {
      if (params['source']) {
        this.source = params['source'];
      }
    });
  }

  ngOnInit(): void {
    setTimeout(()=>{
      bulmaQuickview.attach();
    }, 1000)
  }

}
