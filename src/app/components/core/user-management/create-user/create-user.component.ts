import { Component, EventEmitter, OnInit, Output, HostListener, Input, OnChanges } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { User } from '../../../../models';
import { AlertService, RolesService, UserService } from '../../../../services';

@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.css']
})
export class CreateUserComponent implements OnInit, OnChanges {
  model: User;
  isUpdateForm = false;
  userRole = [];
  selectedRole = this.rolesService.getRoleName(2); // Set role id (2: Editor) as default
  selectedAuthMethod = 'Any';
  authMethods = [];

  @Input() userRoles: any;
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();

  destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private userService: UserService,
    private alertService: AlertService,
    private rolesService: RolesService) { }

  ngOnInit() {
    this.setModel();
    this.authMethods = [{ text: 'Any', value: 'any' }, { text: 'Password', value: 'pwd' }, { text: 'Certificate', value: 'cert' }];
  }

  ngOnChanges(): void {
    this.userRole = this.userRoles.sort((a, b) => a.name.localeCompare(b.name));
  }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    this.toggleModal(false);
  }

  public toggleModal(isOpen: Boolean, form: NgForm = null) {
    if (form != null) {
      this.resetCreateUserForm(form);
    }
    const createUserModal = <HTMLDivElement>document.getElementById('user_modal');
    if (isOpen) {
      this.setModel();
      createUserModal.classList.add('is-active');
      return;
    }
    this.isUpdateForm = false;
    createUserModal.classList.remove('is-active');

    const activeDropDown = Array.prototype.slice.call(document.querySelectorAll('.dropdown.is-active'));
    if (activeDropDown.length > 0) {
      activeDropDown[0].classList.remove('is-active');
    }
  }

  public setModel() {
    this.model = {
      userId: 0,
      username: '',
      real_name: '',
      access_method: 'any',
      password: '',
      description: '',
      confirmPassword: '',
      role_id: 2   // Set role id (2: Editor) as default
    };
  }

  public createUser(form: NgForm) {
    if (form.invalid === true) {
      return;
    }
    if (this.selectedAuthMethod !== 'Certificate' && (this.model.password !== this.model.confirmPassword)) {
      return;
    }
    if (this.selectedAuthMethod === 'Certificate') {
      delete this.model.password;
    }

    this.userService.createUser(this.model)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data) => {
          this.notify.emit();
          this.toggleModal(false, null);
          this.alertService.success(data['message']);
          if (form != null) {
            this.resetCreateUserForm(form);
          }
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public resetCreateUserForm(form: NgForm) {
    form.resetForm();
    this.selectedRole = this.setRoleName(2) // Set role id (2: Editor) as default in roles dropdown
    this.selectedAuthMethod = 'Any';
  }

  setRole(role: any) {
    this.selectedRole = this.setRoleName(role.id);
    const selectedRole = this.userRole.find(r => r.id === role.id);
    if (selectedRole) { this.model.role_id = selectedRole.id; }
  }

  setAuthMethod(authMethod: any) {
    this.selectedAuthMethod = authMethod.text;
    if (authMethod) { this.model.access_method = authMethod.value; }
    if (authMethod.value === 'cert') {
      this.model.password = '';
      this.model.confirmPassword = '';
    }
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

  setRoleName(roleId: number) {
    return this.rolesService.getRoleName(roleId);
  }

  public ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
