import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { inject } from '@angular/core'; 
import { AuthService } from '../../auth/auth.service'; 

export const AuthInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const isPublicEndpoint =
    req.url.includes('/api/auth/') ||
    req.url.includes('/api/email/') ||
    req.url.includes('/api/phone/') ||
    req.url.includes('/api/cities/') ||
    req.url.endsWith('/api/organisations/register') ||
    req.url.includes('/api/organisations/public/licenses/');

  if (isPublicEndpoint) {
    return next(req);
  }

  const authService = inject(AuthService);

  const token = authService.getToken(); 

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}` 
      }
    });
  }
  return next(req); 
};
