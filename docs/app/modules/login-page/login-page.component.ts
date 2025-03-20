import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { MatCard } from '@angular/material/card';
import { AdminLoginFormComponent } from './admin-login-form/admin-login-form.component';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
    selector: 'app-login-page',
    imports: [MatCard, AdminLoginFormComponent],
    templateUrl: './login-page.component.html',
    styleUrl: './login-page.component.scss',
})
export class LoginPageComponent {
    constructor(
        iconRegistry: MatIconRegistry,
        sanitizer: DomSanitizer,
        private authService: AuthService,
        private router: Router,
    ) {
        iconRegistry.addSvgIcon(
            'private',
            sanitizer.bypassSecurityTrustResourceUrl('./assets/icons/lock.svg'),
        );
    }
}
