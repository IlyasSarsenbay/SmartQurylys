import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, map, of } from 'rxjs';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  return authService.getCurrentUser().pipe(
    map((user: { role?: string } | null | undefined) => {
      const role = user?.role ?? null;
      const isAdmin = role === 'ADMIN' || role === 'ROLE_ADMIN';
      return isAdmin ? true : router.createUrlTree(['/projects']);
    }),
    catchError(() => of(authService.isAdmin() ? true : router.createUrlTree(['/projects'])))
  );
};
