import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, NgForm, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService, ProgressBarService, ServicesApiService, SharedService } from '../../../../services';
import { AclService } from '../../../../services/acl.service';
import { DialogService } from '../../../common/confirmation-dialog/dialog.service';
import { uniqBy } from 'lodash';
import { DocService } from '../../../../services/doc.service';
import { CustomValidator } from '../../../../directives/custom-validator';
import { SUPPORTED_SERVICE_TYPES } from '../../../../utils';

@Component({
  selector: 'app-add-control-acl',
  templateUrl: './add-control-acl.component.html',
  styleUrls: ['./add-control-acl.component.css']
})
export class AddControlAclComponent implements OnInit {
  services = [];
  // filter Dispatcher service
  serviceTypes = SUPPORTED_SERVICE_TYPES.filter(t => t != 'Dispatcher');
  aclURLsList = [];

  aclServiceTypeList = [];
  serviceNameList = [];
  serviceTypeList = [];

  userServices = [];
  userScripts = [];

  name = '';
  nameCopy = ''
  editMode = false;

  @ViewChild('aclForm') aclForm: NgForm;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private aclService: AclService,
    private alertService: AlertService,
    private ngProgress: ProgressBarService,
    private dialogService: DialogService,
    private docService: DocService,
    private servicesApiService: ServicesApiService,
    public sharedService: SharedService) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.name = params['name'];
      if (this.name) {
        this.nameCopy = params['name'];
        this.editMode = true;
        this.getACLbyName(this.nameCopy);
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

  refresh() {
    this.getACLbyName(this.nameCopy);
  }

  getACLbyName(name: string) {
    this.aclURLsList = []; // clear list
    this.aclServiceTypeList = [];
    /** request started */
    this.ngProgress.start();
    this.aclService.fetchAclByName(name)
      .subscribe((res: any) => {
        this.name = name;
        this.ngProgress.done();
        // To test users section uncomment below code
        // res['users'] = [
        //   {
        //     "service": "Substation 1104"
        //   },
        //   {
        //     "script": "A#6"
        //   },
        //   {
        //     "service": "Substation 1105"
        //   },
        //   {
        //     "script": "SC9"
        //   }
        // ]

        // get users services list
        this.userServices = res['users']?.map(us => us.service).filter(item => item);

        // get users scripts list
        this.userScripts = res['users']?.map(us => us?.script).filter(item => item);

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
    this.aclForm.form.controls['name'].setValidators([Validators.required, CustomValidator.nospaceValidator, Validators.pattern('^[^\x22]+$')]);
    this.aclForm.form.addControl('urls', new FormGroup({}));
    this.initURLControl(index, urlData);
  }

  addURLControl() {
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
      url: new FormControl(urlData ? urlData?.url : '', [Validators.required, CustomValidator.nospaceValidator]),
      acl: new FormControl(urlData ? urlData?.acl : [])
    }));
    this.aclURLsList.push({ index: index, url: '', acl: [] });
  }

  addNewURLControl(index: number, urlData: any = null) {
    this.aclForm.form.addControl('urls', new FormGroup({}));
    this.urlFormGroup().addControl(`url-${index}`, new FormGroup({
      url: new FormControl(urlData ? urlData?.url : '', [Validators.required, CustomValidator.nospaceValidator]),
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
    this.serviceTypeList.push({ type });
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

  clearACLServiceTypes(index) {
    this.urlControl(index).controls['acl'].patchValue([]);
    this.aclServiceTypeList = [];
    this.aclForm.form.markAsDirty();
  }

  setURL(index, value) {
    const urlControl = (this.urlFormGroup().controls[`url-${index}`] as FormGroup).controls['url'];
    urlControl.setValue(value.trim());
    this.aclForm.form.markAsDirty();
  }

  show(data, isServiceName = false) {
    return data.length > 0 ? data.map(d => isServiceName ? d.name : d.type).join(', ') : 'None';
  }

  goToLink(urlSlug: string) {
    this.docService.goToSetPointControlDocLink(urlSlug);
  }

  onSubmit(form: NgForm) {
    let { name, urls } = form.value;
    urls = urls ? Object.values(urls) : [];
    if (urls) {
      urls.forEach(url => {
        url.acl = url.acl.map(acl => ({ type: acl.type }));
      });
    }
    const services = this.serviceNameList.concat(...this.serviceTypeList);
    const payload = {
      name: name.trim(),
      service: services,
      url: urls
    }
    console.log('payload', payload);
    if (this.editMode) {
      this.updateACL(payload);
      return;
    }
    this.ngProgress.start();
    this.aclService.addACL(payload)
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
    this.aclService.updateACL(this.nameCopy, payload)
      .subscribe((data: any) => {
        this.name = this.nameCopy = payload.name;
        this.router.navigate(['control-dispatcher/acl/', payload.name]);
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
    this.aclService.deleteACL(acl)
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
