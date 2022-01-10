import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertService, ProgressBarService } from '../../../../services';
import { ControlDispatcherService } from '../../../../services/control-dispatcher.service';

@Component({
  selector: 'app-script-details',
  templateUrl: './script-details.component.html',
  styleUrls: ['./script-details.component.css']
})
export class ScriptDetailsComponent implements OnInit {

  scriptName: string;
  controlScript: any;
  steps: any = []
  constructor(

    private route: ActivatedRoute,
    private controlService: ControlDispatcherService,
    private alertService: AlertService,
    private ngProgress: ProgressBarService) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      console.log('script', params);
      this.scriptName = params['name'];
      if (this.scriptName) {
        this.showControlScript(this.scriptName)
      }
    });
  }


  onDrop(event: CdkDragDrop<string[]>) {
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    moveItemInArray(this.controlScript.steps, event.previousIndex, event.currentIndex);
  }

  showControlScript(scriptName: string) {
    /** request started */
    this.ngProgress.start();
    this.controlService.fetchControlServiceScriptByName(scriptName)
      .subscribe((data: any) => {
        this.ngProgress.done();
        const steps = [];
        for (const [key, value] of Object.entries(data.steps)) {
          steps.push({ key, value })
        }
        data.steps = steps;
        this.controlScript = data;
        console.log(this.controlScript);
      }, error => {
        /** request completed */
        this.ngProgress.done();
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      });
  }

  toggleAccordion(id) {
    // this.useFilterProxy = 'true';
    const last = <HTMLElement>document.getElementsByClassName('accordion card is-active')[0];
    if (last !== undefined) {
      const lastActiveContentBody = <HTMLElement>last.getElementsByClassName('card-content')[0];
      const activeId = last.getAttribute('id');
      lastActiveContentBody.hidden = true;
      last.classList.remove('is-active');
      if (id !== +activeId) {
        const next = <HTMLElement>document.getElementById(id);
        const nextActiveContentBody = <HTMLElement>next.getElementsByClassName('card-content')[0];
        nextActiveContentBody.hidden = false;
        next.setAttribute('class', 'accordion card is-active');
      } else {
        last.classList.remove('is-active');
        lastActiveContentBody.hidden = true;
      }
    } else {
      const element = <HTMLElement>document.getElementById(id);
      const body = <HTMLElement>element.getElementsByClassName('card-content')[0];
      body.hidden = false;
      element.setAttribute('class', 'accordion card is-active');
    }
  }

  updateControlScript() {
    //  console.log('form', this.scriptDetailsForm);


  }

}
