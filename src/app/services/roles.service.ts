import { Injectable } from '@angular/core';

enum appRoles { anonymous = 0, admin = 1, user = 2, view = 3, data_view = 4 };

@Injectable({
  providedIn: 'root'
})
export class RolesService {

  /**
   * To check if user, who has the add/edit permission
   * @returns true|false based on user role
   */
  public hasEditorRole(): boolean {
    const roleId = Number(sessionStorage.getItem('roleId'));

    return [appRoles.admin, appRoles.user, appRoles.anonymous].includes(roleId);
  }
}
