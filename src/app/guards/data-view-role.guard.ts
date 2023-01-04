import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { RolesService } from '../services';

@Injectable()
export class DataViewRoleGuard implements CanActivate {
    constructor(public rolesService: RolesService) { }
    canActivate() {
        const isDataViewRole = this.rolesService.hasDataViewRole();
        if (isDataViewRole) {
            return false;
        }
        return true;
    }
}
