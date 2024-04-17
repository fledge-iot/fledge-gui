import { Component, OnInit } from '@angular/core';
import { DocService } from '../../../services/doc.service';

@Component({
  selector: 'app-developer',
  templateUrl: './developer.component.html',
  styleUrls: ['./developer.component.css']
})
export class DeveloperComponent implements OnInit {
  constructor(
    private docService: DocService
  ) { }

  ngOnInit(): void {
  }

  goToLink(urlSlug) {
    if (urlSlug === 'additional-services') {
      this.docService.goToServiceDocLink(urlSlug);
    } else {
      this.docService.goToPythonPackages(urlSlug);
    } 
  }

}
