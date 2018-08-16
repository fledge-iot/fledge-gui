import { Component, OnInit, ViewChild } from '@angular/core';
import { AlertService } from '../../../services/alert.service';
import { Router } from '@angular/router';
import { NorthTaskModalComponent } from './north-task-modal/north-task-modal.component';

@Component({
  selector: 'app-north',
  templateUrl: './north.component.html',
  styleUrls: ['./north.component.css']
})
export class NorthComponent implements OnInit {
  public task: string;
  public tasks = [];

  constructor(private alertService: AlertService, private router: Router) {}

  @ViewChild(NorthTaskModalComponent)
  northTaskModal: NorthTaskModalComponent;

  ngOnInit() {
    // GET north tasks only
    this.getNorthTasks();
  }

  addNorthInstance() {
    this.router.navigate(['/north/add']);
  }

  getNorthTasks() {
    console.log('getNorthTasks');
    this.tasks = [
      { 'name': 'North Readings to PI', 'process': 'OMF to PI North', 'enabled': true, 'sent': 23103 },
      { 'name': 'North Readings to PI', 'process': 'OMF Stats to PI North', 'enabled': true, 'sent': 2290 }
    ];
  }

  openNorthTaskModal(task) {
    this.task = task;
    // call child component method to toggle modal
    this.northTaskModal.toggleModal(true);
  }
}
