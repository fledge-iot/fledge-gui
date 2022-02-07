import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService, ProgressBarService, ServicesApiService, SharedService } from '../../../../services';
import { ControlDispatcherService } from '../../../../services/control-dispatcher.service';
import { DialogService } from '../confirmation-dialog/dialog.service';
import { uniqBy } from 'lodash';

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
  editMode = false;

  @ViewChild('aclForm') aclForm: NgForm;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private controlService: ControlDispatcherService,
    private alertService: AlertService,
    private ngProgress: ProgressBarService,
    private dialogService: DialogService,
    private servicesApiService: ServicesApiService,
    public sharedService: SharedService) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.name = params['name'];
      if (this.name) {
        this.editMode = true;
        this.getACLbyName();
      }
    });
    this.getAllServices();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (!this.editMode) {
        // On add page, show one url control by default
        this.addFormControls(0);
      }
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

  openModal(id: string) {
    this.dialogService.open(id);
  }

  closeModal(id: string) {
    this.dialogService.close(id);
  }

  getACLbyName() {
    this.aclURLsList = []; // clear list
    this.aclServiceTypeList = [];
    /** request started */
    this.ngProgress.start();
    this.controlService.fetchAclByName(this.name)
      .subscribe((res: any) => {
        this.ngProgress.done();
        // Get services list by name
        this.serviceNameList = res.service.filter(item => item.name);
        // Get services list by type
        this.serviceTypeList = res.service.filter(s => s.type);
        // remove duplicate type from service list
        this.serviceTypeList = uniqBy(this.serviceTypeList, 'type');
        const aclURLData = res.url;
        aclURLData.forEach((item, index) => {
          item.index = index;
          if (item.acl) {
            item.acl.forEach(acl => {
              this.aclServiceTypeList.push({ type: acl.type, index });
            });
            // create control for every item in url array
            this.addNewURLControl(index, aclURLData[index]);
          }
          if (item.url) {
            // add url in the list of urls
            this.aclURLsList.push(item);
          }
        });
        this.aclForm.form.markAsPristine();
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
        this.serviceTypes = (this.services.map(s => ({ type: s.type })));
        this.serviceTypes = uniqBy(this.serviceTypes, 'type');
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

  addFormControls(index, urlData: any = null) {
    this.aclForm.form.addControl('urls', new FormGroup({}));
    this.initURLControl(index, urlData);
  }

  addURLControl() {
    console.log(this.aclURLsList.length);
    if (this.aclURLsList.length === 0) {
      this.aclForm.form.addControl('urls', new FormGroup({}));
      this.initURLControl(1);
      return;
    }
    const maxOrder = Math.max(...this.aclURLsList.map(o => o.index));
    this.initURLControl(maxOrder + 1);
  }

  initURLControl(index: number, urlData: any = null) {
    this.urlFormGroup().addControl(`url-${index}`, new FormGroup({
      url: new FormControl(urlData ? urlData?.url : ''),
      acl: new FormControl(urlData ? urlData?.acl : [])
    }));
    this.aclURLsList.push({ index: index, url: '', acl: [] });
  }

  addNewURLControl(index: number, urlData: any = null) {
    this.aclForm.form.addControl('urls', new FormGroup({}));
    this.urlFormGroup().addControl(`url-${index}`, new FormGroup({
      url: new FormControl(urlData ? urlData?.url : ''),
      acl: new FormControl(urlData ? urlData?.acl : [])
    }));
  }

  urlFormGroup(): FormGroup {
    return this.aclForm.controls['urls'] as FormGroup;
  }

  urlControl(index: number): FormGroup {
    return this.urlFormGroup().controls[`url-${index}`] as FormGroup;
  }

  deleteURLControl(index) {
    this.urlFormGroup().removeControl(`url-${index}`);
    this.aclURLsList = this.aclURLsList.filter(item => item.index !== index);
    this.aclForm.form.markAsDirty();
  }

  addServiceName(name: string) {
    this.serviceNameList.push({ name });
    this.aclForm.form.markAsDirty();
  }

  removeServiceName(value: string) {
    this.serviceNameList = this.serviceNameList.filter(item => item.name != value);
    this.aclForm.form.markAsDirty();
  }

  clearServiceNames() {
    this.serviceNameList = [];
    this.aclForm.form.markAsDirty();
  }

  addServiceType(type) {
    this.serviceTypeList.push(type);
    this.aclForm.form.markAsDirty();
  }

  removeServiceType(type: string) {
    this.serviceTypeList = this.serviceTypeList.filter(item => item.type != type);
    this.aclForm.form.markAsDirty();
  }

  clearServiceTypes() {
    this.serviceTypeList = [];
    this.aclForm.form.markAsDirty();
  }

  addACLServiceType(type: string, index: number) {
    this.aclServiceTypeList.push({ type, index })
    this.urlControl(index).controls['acl'].setValue(this.aclServiceTypeList.filter(item => item.index === index));
    this.aclForm.form.markAsDirty();
  }

  removeACLServiceType(type: string, index: number) {
    this.aclServiceTypeList = this.aclServiceTypeList.filter(item => !(item.type == type && item.index === index));
    this.urlControl(index).controls['acl'].setValue(this.aclServiceTypeList.filter(item => item.index === index));
    this.aclForm.form.markAsDirty();
  }

  clearACLServiceTypes() {
    this.aclServiceTypeList = [];
    this.aclForm.form.markAsDirty();
  }

  setURL(index, value) {
    const urlControl = (this.urlFormGroup().controls[`url-${index}`] as FormGroup).controls['url'];
    urlControl.setValue(value);
    this.aclForm.form.markAsDirty();
  }

  show(data, isServiceName = false) {
    return data.length > 0 ? data.map(d => isServiceName ? d.name : d.type).join(', ') : 'None';
  }

  onSubmit(form: NgForm) {
    console.log('form', form.value);
    let { name, urls } = form.value;
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
    if (this.editMode) {
      this.updateACL(payload);
      return;
    }
    this.ngProgress.start();
    this.controlService.addACL(payload)
      .subscribe(() => {
        this.ngProgress.done();
        this.alertService.success(`ACL ${payload['name']} created successfully.`);
        setTimeout(() => {
          this.router.navigate(['control-dispatcher'], { queryParams: { tab: 'acls' } });
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

  updateACL(payload: any) {
    /** request started */
    this.ngProgress.start();
    this.controlService.updateACL(this.name, payload)
      .subscribe((data: any) => {
        this.alertService.success(data.message, true)
        /** request completed */
        this.ngProgress.done();
        this.aclForm.form.markAsPristine();
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

  deleteAcl(acl) {
    /** request started */
    this.ngProgress.start();
    this.controlService.deleteACL(acl)
      .subscribe((data: any) => {
        this.ngProgress.done();
        this.alertService.success(data.message);
        // close modal
        this.closeModal('confirmation-dialog');
        this.router.navigate(['control-dispatcher'], { queryParams: { tab: 'acls' } });
      }, error => {
        /** request completed */
        this.ngProgress.done();
        // close modal
        this.closeModal('confirmation-dialog');
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      });
  }
}
