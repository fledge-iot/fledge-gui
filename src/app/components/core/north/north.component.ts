import { Component, OnInit } from "@angular/core";
import { AlertService } from "../../../services/alert.service";
import { Router } from "@angular/router";
@Component({
  selector: "app-north",
  templateUrl: "./north.component.html",
  styleUrls: ["./north.component.css"]
})
export class NorthComponent implements OnInit {
  public services = [];
  public service: string;
  public tasks = [];

  constructor(private alertService: AlertService, private router: Router) {}

  ngOnInit() {
    // GET north tasks only
    this.getNorthTasks();
  }

  addNorthInstance() {
    this.router.navigate(["/north/add"]);
  }

  getNorthTasks() {
    console.log("getNorthTasks");
    this.tasks = [
      { process: "OMF to PI North", enabled: true, sent: 23103 },
      { process: "OMF Stats to PI North", enabled: true, sent: 2290 }
    ];
  }

  openNorthTaskmodal() {}
}
