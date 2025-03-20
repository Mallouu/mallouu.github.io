import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIcon, MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { MatButton, MatFabButton } from '@angular/material/button';
import { Router } from '@angular/router';

@Component({
    selector: 'app-header',
    imports: [MatToolbarModule, MatIcon, MatFabButton, MatButton],
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss',
})
export class HeaderComponent {
    constructor(
        iconRegistry: MatIconRegistry,
        sanitizer: DomSanitizer,
        private router: Router,
    ) {
        iconRegistry.addSvgIcon(
            'boat',
            sanitizer.bypassSecurityTrustResourceUrl('./assets/icons/boat.svg'),
        );
        iconRegistry.addSvgIcon(
            'private',
            sanitizer.bypassSecurityTrustResourceUrl('./assets/icons/lock.svg'),
        );
    }

    goToAdmin() {
        console.log('goToAdmin');
        this.router.navigate(['/administration']);
    }

    goToHome() {
        console.log('goToHome');
        this.router.navigate(['/reservation']);
    }
}
