import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserResponse } from '../../core/models/user';
import { UserService } from '../../core/user.service';
import { Router } from '@angular/router'; // Re-inject Router
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-admin-user-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-user-management.component.html', // Changed to templateUrl
  styleUrls: ['./admin-user-management.component.css'] // Changed to styleUrls
})
export class AdminUserManagementComponent implements OnInit {
  users: UserResponse[] = [];
  loading: boolean = true;
  errorMessage: string = '';

  constructor(private userService: UserService, private router: Router) { } // Re-inject Router

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';
    this.userService.getAllUsers().pipe(
      catchError(error => {
        console.error('Error loading users:', error);
        this.errorMessage = 'Ошибка загрузки пользователей.';
        this.loading = false;
        return of([]); // Return an empty array on error
      })
    ).subscribe(users => {
      this.users = users;
      this.loading = false;
    });
  }

  viewUser(userId: number): void {
    console.log('Navigating to view user:', userId);
    this.router.navigate(['/admin/users/view', userId]); // Navigate to a placeholder view route
  }

  editUser(userId: number): void {
    console.log('Navigating to edit user:', userId);
    this.router.navigate(['/admin/users/edit', userId]); // Navigate to a placeholder edit route
  }

  deleteUser(userId: number): void {
    if (confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      this.userService.deleteUser(userId).subscribe({
        next: () => {
          console.log('User deleted:', userId);
          this.loadUsers(); // Refresh the list
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          this.errorMessage = 'Ошибка при удалении пользователя.';
        }
      });
    }
  }
}
