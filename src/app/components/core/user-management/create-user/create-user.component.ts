import { Component, EventEmitter, OnInit, Output, HostListener, Input, OnChanges } from '@angular/core';
import { NgForm } from '@angular/forms';

import { User } from '../../../../models';
import { AlertService, UserService } from '../../../../services';

@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.css']
})
export class CreateUserComponent implements OnInit, OnChanges {
  model: User;
  isUpdateForm = false;
  userRole = [];
  selectedRole = 'user'; // set "user" as a default role
  selectedAuthMethod = 'Any';
  authMethods = [];

  @Input() userRoles: any;
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();

  constructor(private userService: UserService,
    private alertService: AlertService) { }

  ngOnInit() {
    this.model = {
      userId: 0,
      username: '',
      realName: '',
      authMethod: 'any',
      password: '',
      description: '',
      confirmPassword: '',
      roleId: 2   // set "user" as a default role
    };
    this.authMethods = [{text: 'Any', value: 'any'}, {text: 'Password', value: 'pwd'}, {text: 'Certificate', value: 'cert'}];
  }

  ngOnChanges(): void {
    this.userRole = this.userRoles;
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

  public createUser(form: NgForm) {
    if (this.selectedAuthMethod !== 'cert' && (this.model.password !== this.model.confirmPassword)) {
      return;
    }
    this.userService.createUser(this.model).
      subscribe(
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
    this.selectedRole = 'user';
  }

  setRole(role: any) {
    this.selectedRole = role.name;
    const selectedRole = this.userRole.find(r => r.id = role.id);
    if (role) { this.model.roleId = selectedRole.id; }
  }

  setAuthMethod(authMethod: any) {
    this.selectedAuthMethod = authMethod.text;
    if (authMethod) { this.model.authMethod = authMethod.value; }
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
}
