import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable()
export class AdminGuard  {
  constructor(private router: Router) { }
  canActivate() {
    const isAdmin = JSON.parse(sessionStorage.getItem('isAdmin'));
    if (isAdmin) {
      // logged in as admin then return true
      return true;
    }
    // If not logged in as admin then redirect to dashboard
    this.router.navigate(['']);
    return false;
  }
}
