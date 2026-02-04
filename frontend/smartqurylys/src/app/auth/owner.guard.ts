import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { ProjectService } from '../core/project.service';
import { UserService } from '../core/user.service';
import { map, catchError, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

export const ownerGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const projectService = inject(ProjectService);
  const userService = inject(UserService);
  const router = inject(Router);

  const projectId = +route.paramMap.get('id')!; 

  if (isNaN(projectId)) {
    router.navigate(['/dashboard']); // Redirect if project ID is invalid
    return false;
  }

  return userService.getCurrentUser().pipe(
    switchMap(currentUser => {
      // Check if user is logged in
      if (!currentUser || !currentUser.iinBin) {
        router.navigate(['/login']); 
        return of(false);
      }

      return projectService.getProjectById(projectId).pipe(
        map(project => {
          if (project.ownerIinBin === currentUser.iinBin) {
            return true;
          } else {
            router.navigate(['/dashboard']); // Redirect if not owner
            return false;
          }
        }),
        catchError(error => {
          console.error('Failed to fetch project details for ownerGuard:', error);
          router.navigate(['/dashboard']); // Redirect on error
          return of(false);
        })
      );
    }),
    catchError(error => {
      console.error('Failed to fetch current user for ownerGuard:', error);
      router.navigate(['/login']); // Redirect if current user cannot be fetched (e.g., not logged in)
      return of(false);
    })
  );
};
