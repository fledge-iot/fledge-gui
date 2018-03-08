import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable()
export class SharedService {
    public IsUserLoggedIn: Subject<any> = new Subject<any>();
}