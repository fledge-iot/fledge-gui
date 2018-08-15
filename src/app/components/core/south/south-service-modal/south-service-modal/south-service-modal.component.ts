import { ConfigurationService, AlertService } from "../../../../../services";
import { Component, OnInit, Input, OnChanges } from "@angular/core";
import { NgForm } from "@angular/forms";
import * as _ from "lodash";

@Component({
  selector: "app-south-service-modal",
  templateUrl: "./south-service-modal.component.html",
  styleUrls: ["./south-service-modal.component.css"]
})
export class SouthServiceModalComponent implements OnInit, OnChanges {
  category: any;

  configItems = [];

  model: any;

  @Input()
  service: { service: any };

  constructor(
    private configService: ConfigurationService,
    private alertService: AlertService
  ) {}

  ngOnInit() {}

  ngOnChanges() {
    if (this.service !== undefined) {
      this.getCategory();
    }
  }
  public toggleModal(isOpen: Boolean) {
    const schedule_name = <HTMLDivElement>(
      document.getElementById("south-service-modal")
    );
    if (isOpen) {
      schedule_name.classList.add("is-active");
      return;
    }
    schedule_name.classList.remove("is-active");
  }

  public getCategory(): void {
    console.log(this.service);
    // this.configurationData = [];
    this.configService.getCategory(this.service["name"]).subscribe(
      (data: any) => {
        this.category = {
          value: [data],
          key: this.service["name"]
        };

        console.log("category", this.category);

          for (const key in data) {
            if (data.hasOwnProperty(key)) {
              this.configItems.push({
                [key]: data[key].value,
                type: data[key].type
              });
            }
          }
          // console.log(this.configItems);
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText, true);
          }
        }
    );
  }

  public saveConfiguration(form: NgForm) {
    const updatedRecord = [];
    const formData = form.value;
    for (const key in formData) {
      if (formData.hasOwnProperty(key)) {
        updatedRecord.push({
          [key]: formData[key]
        });
      }
    }
    const diff = this.difference(updatedRecord, this.configItems);
    this.configItems.forEach(item => {
      for (const key in item) {
        diff.forEach(changedItem => {
          for (const k in changedItem) {
            if (key === k && item[key] !== changedItem[k]) {
              this.saveConfigValue(this.service['name'], key, changedItem[k], item.type);
            }
          }
        });
      }
    });
  }

  public difference(obj, bs) {
    function changes(object, base) {
      return _.transform(object, function(result, value, key) {
        if (!_.isEqual(value, base[key])) {
          result[key] =
            _.isObject(value) && _.isObject(base[key])
              ? changes(value, base[key])
              : value;
        }
      });
    }
    return changes(obj, bs);
  }

  public saveConfigValue(categoryName: string, configItem: string, value: string, type: string) {
    console.log('item ', categoryName, configItem, value, type);
    this.configService.saveConfigItem(categoryName, configItem, value, type).
      subscribe(
        (data) => {
          if (data['value'] !== undefined) {
            this.alertService.success('Value updated successfully');
          }
          this.toggleModal(false);
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }
}
