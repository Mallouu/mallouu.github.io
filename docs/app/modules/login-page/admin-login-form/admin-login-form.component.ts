import { Component } from '@angular/core';
import { MatCardActions } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-admin-login-form',
    imports: [
        MatIcon,
        MatFormField,
        MatInput,
        ReactiveFormsModule,
        NgIf,
        MatCardActions,
        MatButton,
        MatError,
        MatLabel,
    ],
    templateUrl: './admin-login-form.component.html',
    styleUrl: './admin-login-form.component.scss',
})
export class AdminLoginFormComponent {
    loginForm: FormGroup;
    isLoading: boolean = false;

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private authService: AuthService,
    ) {
        this.loginForm = this.fb.group({
            username: ['', Validators.required],
            password: ['', Validators.required],
        });
    }

    onSubmit() {
        if (this.loginForm.invalid) return;

        this.isLoading = true;
        const { username, password } = this.loginForm.value;

        setTimeout(() => {
            if (username === 'admin' && password === 'admin') {
                this.authService.login('fakeToken123');
                localStorage.setItem('isAdminAuthenticated', 'true');
                this.router.navigate(['/administration']);
            } else {
                alert("Nom d'utilisateur ou mot de passe incorrect.");
            }
            this.isLoading = false;
        }, 500);
    }
}
