import { Injectable } from '@angular/core';

enum appRoles { admin = 1, user = 2, view = 3, data_view = 4 };

@Injectable({
  providedIn: 'root'
})
export class RolesService {

  /**
   * To check if user, who has the add/edit permission
   * @returns true|false based on user role
   */
  hasEditorRole(): boolean {
    const uid = Number(sessionStorage.getItem('uid'));
    console.log('uid', uid);

    return [appRoles.admin, appRoles.user].includes(uid);
  }
}
