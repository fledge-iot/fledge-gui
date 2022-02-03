import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService, ProgressBarService, ServicesApiService, SharedService } from '../../../../services';
import { ControlDispatcherService } from '../../../../services/control-dispatcher.service';
import { DialogService } from '../confirmation-dialog/dialog.service';

@Component({
  selector: 'app-add-control-acl',
  templateUrl: './add-control-acl.component.html',
  styleUrls: ['./add-control-acl.component.css']
})
export class AddControlAclComponent implements OnInit {
  services = [];
  serviceTypes = []
  aclURLsList = [];

  aclServiceTypeList = [];
  serviceNameList = [];
  serviceTypeList = [];
  name: string;

  @ViewChild('aclForm') aclForm: NgForm;

  constructor(private cdRef: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute,
    private controlService: ControlDispatcherService,
    private alertService: AlertService,
    private ngProgress: ProgressBarService,
    private dialogService: DialogService,
    private servicesApiService: ServicesApiService,
    public sharedService: SharedService) { }

  ngOnInit(): void {
    this.getAllServices();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.addFormControls(1);
    }, 0);
  }

  public toggleDropDown(id: string) {
    const activeDropDowns = Array.prototype.slice.call(document.querySelectorAll('.dropdown.is-active'));
    if (activeDropDowns.length > 0) {
      if (activeDropDowns[0].id !== id) {
        activeDropDowns[0].classList.remove('is-active');
      }
    }
    const dropDown = document.querySelector(`#${id}`);
    dropDown.classList.toggle('is-active');
  }

  public getAllServices() {
    /** request start */
    this.ngProgress.start();
    this.servicesApiService.getAllServices()
      .subscribe((res: any) => {
        /** request done */
        this.ngProgress.done();
        this.services = res.services.map((s: any) => {
          s.select = false;
          return s;
        });
        // this.services = groupBy(this.services, 'type');
        console.log('service', this.services);
        this.serviceTypes = [... new Set(this.services.map(s => s.type))];
        console.log('type', this.serviceTypes);

      },
        (error) => {
          /** request done */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  addFormControls(index) {
    this.aclForm.form.addControl('urls', new FormGroup({}));
    // this.aclForm.form.addControl('services', new FormGroup({}));
    this.initURLControl(index);
    // this.initServiceControl(index);
  }

  addURLControl() {
    // console.log(Math.max(...this.stepControlsList.map(o => o.order)));
    const maxOrder = Math.max(...this.aclURLsList.map(o => o.key));
    this.initURLControl(maxOrder + 1)
  }

  initURLControl(index: number) {
    this.urlFormGroup().addControl(`url-${index}`, new FormGroup({
      url: new FormControl(''),
      acl: new FormControl('')
    }));
    this.aclURLsList.push({ key: index });
  }

  urlFormGroup() {
    console.log('url control', this.aclForm.controls['urls']);
    return this.aclForm.controls['urls'] as FormGroup;
  }

  addServiceName(name: string) {
    this.serviceNameList.push({ name });
    console.log('add one name', this.serviceNameList);
  }

  removeServiceName(value: string) {
    this.serviceNameList = this.serviceNameList.filter(item => item.name != value);
    console.log('remove one name', this.serviceNameList);
  }

  clearServiceNames() {
    this.serviceNameList = [];
    console.log('clear name', this.serviceNameList);
  }

  addServiceType(type: string) {
    this.serviceTypeList.push({ type })
    console.log('add one type', type);
  }

  removeServiceType(type: string) {
    this.serviceTypeList = this.serviceTypeList.filter(item => item.type != type);
    console.log('remove one type', this.serviceTypeList);
  }

  clearServiceTypes() {
    this.serviceTypeList = [];
    console.log('clear type', this.serviceTypeList);
  }

  addACLServiceType(type: string, index: number) {
    this.aclServiceTypeList.push({ type, index })
    console.log('add one type', this.aclServiceTypeList, index);
    console.log('url control', this.urlFormGroup().controls[`url-${index}`] as FormGroup);
    const urlControl = (this.urlFormGroup().controls[`url-${index}`] as FormGroup).controls['acl'];

    urlControl.setValue(this.aclServiceTypeList.filter(item => item.index === index));
  }

  removeACLServiceType(type: string, index: number) {
    this.aclServiceTypeList = this.aclServiceTypeList.filter(item => item.type != type);
    const urlControl = (this.urlFormGroup().controls[`url-${index}`] as FormGroup).controls['acl'];
    urlControl.setValue(this.aclServiceTypeList.filter(item => item.index === index));
  }

  clearACLServiceTypes() {
    this.aclServiceTypeList = [];
    console.log('clear type', this.aclServiceTypeList);
  }

  setURL(index, value) {
    const urlControl = (this.urlFormGroup().controls[`url-${index}`] as FormGroup).controls['url'];
    urlControl.setValue(value);
  }

  onSubmit(form: NgForm) {
    console.log('form', form.value);
    let { name, urls } = form.value;
    console.log('name', name);
    urls = Object.values(urls);
    console.log('urls', urls);
    const services = this.serviceNameList.concat(...this.serviceTypeList);
    console.log('services', services);
    const payload = {
      name: name,
      service: services,
      url: urls
    }
    console.log('payload', payload);
    this.ngProgress.start();
    this.controlService.addACL(payload)
      .subscribe((d) => {
        console.log(d);

        this.ngProgress.done();
        this.alertService.success(`Script ${payload['name']} created successfully.`);
        setTimeout(() => {
          this.router.navigate(['control-dispatcher']);
        }, 1000);
      }, error => {
        this.ngProgress.done();
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      });
  }
}
