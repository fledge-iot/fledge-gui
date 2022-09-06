import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AlertService } from './alert.service';

export const InterceptorSkipHeader = 'X-Skip-Interceptor';

@Injectable()
export class HttpsRequestInterceptor implements HttpInterceptor {

  constructor(private router: Router,
    private alertService: AlertService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.headers.has(InterceptorSkipHeader)) {
      const headers = req.headers.delete(InterceptorSkipHeader);
      return next.handle(req.clone({ headers }));
    } else {
      if (sessionStorage.getItem('token') != null) {
        req = req.clone({
          setHeaders: {
            authorization: sessionStorage.getItem('token')
          }
        });
      }
      return next.handle(req).pipe(map((event: HttpEvent<any>) => {
        return event;
      }), catchError((err: any) => {
        if (err instanceof HttpErrorResponse) {
          if (err.status === 0) {
            this.alertService.error('Failed to connect');
          } else if (err.status === 401 && !location.href.includes('/setting?id=1')) {
            sessionStorage.clear();
            // this.router.navigate(['/login']);
          }
        } else { // not a HttpErrorResponse
          this.alertService.error(err.message);
        }
        return throwError(err);
      }));
    }
  }
}
