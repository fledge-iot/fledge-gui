import { Component, OnInit, EventEmitter, Input, Output, Directive } from '@angular/core';
import { UserService, AlertService } from '../services/index';
import Utils from '../utils';

@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.css']
})
export class CreateUserComponent implements OnInit {
  model: any = {}

  @Output() notify: EventEmitter<any> = new EventEmitter<any>();

  constructor(private userService: UserService,
    private alertService: AlertService) { }

  ngOnInit() { }

  public toggleModal(isOpen: Boolean) {
    let createUserModal = <HTMLDivElement>document.getElementById('user_modal');
    if (isOpen) {
      createUserModal.classList.add('is-active');
      return;
    }
    createUserModal.classList.remove('is-active');
  }

  public createUser() {
    let token = sessionStorage.getItem('token');
    this.userService.createUser(this.model, token).
      subscribe(
        data => {
          this.notify.emit();
          this.toggleModal(false);
          this.alertService.success(data.message);
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
