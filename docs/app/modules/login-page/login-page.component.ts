import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-login-page',
    imports: [],
    templateUrl: './login-page.component.html',
    styleUrl: './login-page.component.scss',
})
export class LoginPageComponent {
    constructor(
        private authService: AuthService,
        private router: Router,
    ) {}

    login() {
        this.authService.login('fakeToken123'); // Ici, un vrai token JWT devrait être utilisé
        this.router.navigate(['/administration']);
    }
}
